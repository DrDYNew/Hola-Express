using HolaExpress_BE.DTOs.Wallet;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace HolaExpress_BE.Services;

public class WalletService : IWalletService
{
    private readonly IWalletRepository _walletRepository;
    private readonly HolaExpressContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WalletService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _checksumKey;
    private readonly string _baseUrl;
    private readonly INotificationService _notificationService;

    public WalletService(
        IWalletRepository walletRepository,
        HolaExpressContext context,
        IConfiguration configuration,
        ILogger<WalletService> logger,
        IHttpClientFactory httpClientFactory,
        INotificationService notificationService)
    {
        _walletRepository = walletRepository;
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _apiKey = configuration["PayOSSettings:ApiKey"] ?? "";
        _checksumKey = configuration["PayOSSettings:ChecksumKey"] ?? "";
        _baseUrl = configuration["PayOSSettings:BaseUrl"] ?? "https://api-merchant.payos.vn";
        _notificationService = notificationService;
    }

    public async Task<WalletDto> GetWalletAsync(int userId)
    {
        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            throw new Exception("Wallet not found");
        }

        return new WalletDto
        {
            WalletId = wallet.WalletId,
            UserId = wallet.UserId ?? 0,
            Balance = wallet.Balance ?? 0,
            Currency = wallet.Currency ?? "VND",
            UpdatedAt = wallet.UpdatedAt
        };
    }

    public async Task<TransactionHistoryDto> GetTransactionHistoryAsync(int userId, int page = 1, int pageSize = 20)
    {
        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            throw new Exception("Wallet not found");
        }

        var transactions = await _walletRepository.GetTransactionHistoryAsync(wallet.WalletId, page, pageSize);
        var totalCount = await _context.WalletTransactions
            .Where(t => t.WalletId == wallet.WalletId)
            .CountAsync();

        return new TransactionHistoryDto
        {
            Transactions = transactions.Select(t => new TransactionDto
            {
                TransactionId = t.TransactionId,
                Amount = t.Amount,
                TransactionType = t.TransactionType ?? "",
                Description = t.Description ?? "",
                ReferenceOrderId = t.ReferenceOrderId,
                CreatedAt = t.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TopUpPaymentDataDto> CreateTopUpPaymentAsync(int userId, TopUpRequestDto request)
    {
        if (request.Amount <= 0)
        {
            throw new Exception("Amount must be greater than 0");
        }

        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            throw new Exception("Wallet not found");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new Exception("User not found");
        }

        // Generate unique order code
        var orderCode = long.Parse(DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(1000, 9999));

        // Create pending transaction with amount 0 (will be updated when payment is verified)
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Amount = 0, // Pending - will be updated when payment completes
            TransactionType = "DEPOSIT",
            Description = $"Nap tien - OrderCode: {orderCode}",
            CreatedAt = DateTime.Now
        };

        await _walletRepository.AddTransactionAsync(transaction);

        // Create PayOS payment request
        var payosRequest = new
        {
            orderCode = orderCode,
            amount = (int)request.Amount,
            description = $"Nap tien vi HolaExpress",
            buyerName = user.FullName ?? "Khach hang",
            buyerEmail = user.Email,
            buyerPhone = user.PhoneNumber ?? "",
            returnUrl = $"{_configuration["AppSettings:BaseUrl"]}/payment/success",
            cancelUrl = $"{_configuration["AppSettings:BaseUrl"]}/payment/cancel",
            expiredAt = (int)DateTimeOffset.Now.AddMinutes(15).ToUnixTimeSeconds()
        };

        // Generate signature
        var signatureData = $"amount={payosRequest.amount}&cancelUrl={payosRequest.cancelUrl}&description={payosRequest.description}&orderCode={payosRequest.orderCode}&returnUrl={payosRequest.returnUrl}";
        var signature = GenerateSignature(signatureData);

        var payosRequestWithSignature = new
        {
            payosRequest.orderCode,
            payosRequest.amount,
            payosRequest.description,
            buyerName = payosRequest.buyerName,
            buyerEmail = payosRequest.buyerEmail,
            buyerPhone = payosRequest.buyerPhone,
            returnUrl = payosRequest.returnUrl,
            cancelUrl = payosRequest.cancelUrl,
            expiredAt = payosRequest.expiredAt,
            signature = signature
        };

        // Call PayOS API
        try
        {
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v2/payment-requests");
            requestMessage.Headers.Add("x-client-id", _configuration["PayOSSettings:ClientId"]);
            requestMessage.Headers.Add("x-api-key", _apiKey);
            requestMessage.Content = new StringContent(
                JsonSerializer.Serialize(payosRequestWithSignature),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.SendAsync(requestMessage);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            _logger.LogInformation("PayOS Response: {Response}", responseContent);

            var payosResponse = JsonSerializer.Deserialize<PayOSPaymentResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (payosResponse != null && payosResponse.Code == "00" && payosResponse.Data != null)
            {
                // Return Unix timestamp in milliseconds for JavaScript compatibility
                var expiresAtMs = payosRequest.expiredAt * 1000L;
                
                return new TopUpPaymentDataDto
                {
                    CheckoutUrl = payosResponse.Data.CheckoutUrl,
                    OrderCode = payosResponse.Data.OrderCode.ToString(),
                    TransactionId = transaction.TransactionId,
                    Amount = (int)request.Amount,
                    Description = payosRequest.description,
                    QrCode = payosResponse.Data.QrCode ?? "",
                    AccountNumber = payosResponse.Data.AccountNumber ?? "",
                    AccountName = payosResponse.Data.AccountName ?? "",
                    ExpiresAt = expiresAtMs.ToString()
                };
            }
            else
            {
                throw new Exception(payosResponse?.Desc ?? "Failed to create payment link");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling PayOS API");
            throw new Exception("Unable to create payment link. Please try again.");
        }
    }

    public async Task<bool> VerifyTopUpPaymentAsync(string orderCode)
    {
        if (!long.TryParse(orderCode, out long code))
        {
            return false;
        }

        // Find pending transaction
        var transaction = await _context.WalletTransactions
            .Where(t => t.TransactionType == "DEPOSIT" && t.Description!.Contains(orderCode) && t.Amount == 0)
            .FirstOrDefaultAsync();

        if (transaction == null)
        {
            return false;
        }

        // Call PayOS to verify
        try
        {
            var requestMessage = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/v2/payment-requests/{code}");
            requestMessage.Headers.Add("x-client-id", _configuration["PayOSSettings:ClientId"]);
            requestMessage.Headers.Add("x-api-key", _apiKey);

            var response = await _httpClient.SendAsync(requestMessage);
            var responseContent = await response.Content.ReadAsStringAsync();
            var paymentInfo = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (paymentInfo.GetProperty("code").GetString() == "00")
            {
                var status = paymentInfo.GetProperty("data").GetProperty("status").GetString();
                var paidAmount = paymentInfo.GetProperty("data").GetProperty("amount").GetInt32();
                
                if (status == "PAID" || status == "COMPLETED")
                {
                    // Update transaction with actual amount
                    transaction.Amount = paidAmount;
                    
                    // Update wallet balance
                    var wallet = await _context.Wallets.FindAsync(transaction.WalletId);
                    if (wallet != null)
                    {
                        wallet.Balance = (wallet.Balance ?? 0) + paidAmount;
                        wallet.UpdatedAt = DateTime.Now;
                        await _context.SaveChangesAsync();

                        // Notify user
                        if (wallet.UserId != null)
                            await _notificationService.SendAsync(wallet.UserId.Value,
                                "Nạp tiền thành công 💰",
                                $"Tài khoản của bạn đã được cộng {paidAmount:N0}đ. Số dư hiện tại: {wallet.Balance:N0}đ",
                                "WALLET_TOPUP");
                    }

                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment with PayOS");
        }

        return false;
    }

    private string GenerateSignature(string data)
    {
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_checksumKey)))
        {
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }

    public async Task<WalletDto> WithdrawAsync(int userId, WithdrawRequestDto request)
    {
        if (request.Amount <= 0)
        {
            throw new Exception("Amount must be greater than 0");
        }

        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            throw new Exception("Wallet not found");
        }

        if ((wallet.Balance ?? 0) < request.Amount)
        {
            throw new Exception("Insufficient balance");
        }

        // Add transaction
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Amount = -request.Amount,
            TransactionType = "WITHDRAW",
            Description = $"Rút tiền về {request.BankName} - {request.BankAccount}" +
                         (string.IsNullOrEmpty(request.Note) ? "" : $" - {request.Note}"),
            CreatedAt = DateTime.Now
        };

        await _walletRepository.AddTransactionAsync(transaction);

        // Update balance
        var newBalance = (wallet.Balance ?? 0) - request.Amount;
        await _walletRepository.UpdateWalletBalanceAsync(wallet.WalletId, newBalance);

        // Notify user
        await _notificationService.SendAsync(userId,
            "Rút tiền thành công 💸",
            $"Đã rút {request.Amount:N0}đ về tài khoản {request.BankName}. Số dư hiện tại: {newBalance:N0}đ",
            "WALLET_WITHDRAW");

        return await GetWalletAsync(userId);
    }

    public async Task<bool> DeductBalanceAsync(int userId, decimal amount, string description, int? referenceOrderId = null)
    {
        if (amount <= 0)
        {
            throw new Exception("Amount must be greater than 0");
        }

        var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
        if (wallet == null)
        {
            throw new Exception("Wallet not found");
        }

        if ((wallet.Balance ?? 0) < amount)
        {
            throw new Exception("Insufficient balance");
        }

        // Add transaction
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Amount = -amount,
            TransactionType = "PAYMENT",
            Description = description,
            ReferenceOrderId = referenceOrderId,
            CreatedAt = DateTime.Now
        };

        await _walletRepository.AddTransactionAsync(transaction);

        // Update balance
        var newBalance = (wallet.Balance ?? 0) - amount;
        await _walletRepository.UpdateWalletBalanceAsync(wallet.WalletId, newBalance);

        return true;
    }
}
