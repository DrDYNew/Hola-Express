using HolaExpress_BE.DTOs.Order;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Security.Cryptography;
using System.Text;

namespace HolaExpress_BE.Services;

// PayOS Response classes
public class PayOSPaymentResponse
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;
    
    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;
    
    [JsonPropertyName("data")]
    public PayOSData? Data { get; set; }
}

public class PayOSData
{
    [JsonPropertyName("checkoutUrl")]
    public string CheckoutUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }
    
    [JsonPropertyName("qrCode")]
    public string? QrCode { get; set; }
    
    [JsonPropertyName("accountNumber")]
    public string? AccountNumber { get; set; }
    
    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }
}

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICartService _cartService;
    private readonly IWalletService _walletService;
    private readonly HolaExpressContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrderService> _logger;
    private readonly HttpClient _httpClient;

    public OrderService(
        IOrderRepository orderRepository,
        ICartService cartService,
        IWalletService walletService,
        HolaExpressContext context,
        IConfiguration configuration,
        ILogger<OrderService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _orderRepository = orderRepository;
        _cartService = cartService;
        _walletService = walletService;
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<CreateOrderResponseDto> CreateOrderAsync(int userId, CreateOrderDto request)
    {
        // Validate payment method
        if (!new[] { "cash", "wallet", "banking" }.Contains(request.PaymentMethod.ToLower()))
        {
            throw new Exception("Invalid payment method");
        }

        // Get cart
        var cart = await _cartService.GetCartAsync(userId);
        if (cart == null || cart.Items.Count == 0)
        {
            throw new Exception("Cart is empty");
        }

        // Get address
        var address = await _context.UserAddresses.FindAsync(request.UserAddressId);
        if (address == null || address.UserId != userId)
        {
            throw new Exception("Invalid address");
        }

        // Calculate totals
        var subtotal = cart.SubTotal;
        var discountAmount = 0m;
        
        // Apply voucher if any
        if (request.VoucherId.HasValue)
        {
            var voucher = await _context.Vouchers.FindAsync(request.VoucherId.Value);
            if (voucher != null && voucher.IsActive == true)
            {
                // Use discount value directly
                discountAmount = voucher.DiscountValue;
                
                // Check minimum order value if set
                if (voucher.MinOrderValue.HasValue && subtotal < voucher.MinOrderValue.Value)
                {
                    discountAmount = 0; // Don't apply discount if min order value not met
                }
                
                // Cap discount at max allowed if set
                if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount.Value)
                {
                    discountAmount = voucher.MaxDiscountAmount.Value;
                }
            }
        }

        var totalAmount = subtotal + request.ShippingFee - discountAmount;

        // Validate wallet balance if paying with wallet
        if (request.PaymentMethod.ToLower() == "wallet")
        {
            var wallet = await _walletService.GetWalletAsync(userId);
            if (wallet.Balance < totalAmount)
            {
                throw new Exception("Insufficient wallet balance");
            }
        }

        // Create order
        var orderCode = GenerateOrderCode();
        var order = new Order
        {
            OrderCode = orderCode,
            CustomerId = userId,
            StoreId = request.StoreId,
            Subtotal = subtotal,
            ShippingFee = request.ShippingFee,
            DiscountAmount = discountAmount,
            TotalAmount = totalAmount,
            Status = "PENDING",
            PaymentMethod = request.PaymentMethod.ToUpper(),
            PaymentStatus = request.PaymentMethod.ToLower() == "cash" ? "PENDING" : "PENDING",
            OrderSource = "MOBILE_APP",
            DeliveryAddress = address.AddressText,
            CustomerNote = request.CustomerNote,
            CreatedAt = DateTime.Now
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // Create order details from cart items
        foreach (var item in cart.Items)
        {
            var orderDetail = new OrderDetail
            {
                OrderId = order.OrderId,
                ProductId = item.ProductId,
                ProductNameSnapshot = item.ProductName,
                VariantNameSnapshot = item.VariantName,
                Quantity = item.Quantity,
                PriceSnapshot = item.BasePrice + item.VariantPriceAdjustment,
                TotalPrice = item.TotalPrice
            };

            _context.OrderDetails.Add(orderDetail);
            await _context.SaveChangesAsync();

            // Add toppings if any
            if (item.Toppings != null && item.Toppings.Count > 0)
            {
                foreach (var topping in item.Toppings)
                {
                    var orderTopping = new OrderDetailTopping
                    {
                        DetailId = orderDetail.DetailId,
                        ToppingNameSnapshot = topping.ToppingName,
                        PriceSnapshot = topping.Price
                    };
                    _context.OrderDetailToppings.Add(orderTopping);
                }
                await _context.SaveChangesAsync();
            }
        }

        var response = new CreateOrderResponseDto
        {
            OrderId = order.OrderId,
            OrderCode = orderCode,
            TotalAmount = totalAmount,
            PaymentMethod = request.PaymentMethod.ToUpper(),
            PaymentStatus = "PENDING"
        };

        // Handle payment based on method
        if (request.PaymentMethod.ToLower() == "wallet")
        {
            // Deduct from wallet immediately
            await _walletService.DeductBalanceAsync(
                userId, 
                totalAmount, 
                $"Payment for order {orderCode}",
                order.OrderId
            );

            order.PaymentStatus = "PAID";
            order.Status = "CONFIRMED";
            await _context.SaveChangesAsync();

            response.PaymentStatus = "PAID";

            // Clear cart
            await _cartService.ClearCartAsync(userId);
        }
        else if (request.PaymentMethod.ToLower() == "banking")
        {
            // Create PayOS payment
            try
            {
                var paymentData = await CreatePayOSPayment(order, userId);
                response.PaymentData = paymentData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayOS payment");
                throw new Exception("Unable to create PayOS payment. Please try again.");
            }
        }
        else // cash
        {
            // Just confirm the order
            order.Status = "CONFIRMED";
            await _context.SaveChangesAsync();

            // Clear cart
            await _cartService.ClearCartAsync(userId);
        }

        return response;
    }

    private string GenerateOrderCode()
    {
        return "OD" + DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(1000, 9999);
    }

    private async Task<PaymentDataDto> CreatePayOSPayment(Order order, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new Exception("User not found");
        }

        var orderCode = long.Parse(DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(1000, 9999));
        var apiKey = _configuration["PayOSSettings:ApiKey"] ?? "";
        var checksumKey = _configuration["PayOSSettings:ChecksumKey"] ?? "";
        var baseUrl = _configuration["PayOSSettings:BaseUrl"] ?? "https://api-merchant.payos.vn";

        var description = $"DH {order.OrderCode}".Length > 25 
            ? $"DH {order.OrderCode.Substring(0, 15)}" 
            : $"DH {order.OrderCode}";

        var payosRequest = new
        {
            orderCode = orderCode,
            amount = (int)order.TotalAmount,
            description = description,
            buyerName = user.FullName ?? "Khach hang",
            buyerEmail = user.Email,
            buyerPhone = user.PhoneNumber ?? "",
            returnUrl = $"{_configuration["AppSettings:BaseUrl"]}/payment/success",
            cancelUrl = $"{_configuration["AppSettings:BaseUrl"]}/payment/cancel",
            expiredAt = (int)DateTimeOffset.Now.AddMinutes(15).ToUnixTimeSeconds()
        };

        // Generate signature
        var signatureData = $"amount={payosRequest.amount}&cancelUrl={payosRequest.cancelUrl}&description={payosRequest.description}&orderCode={payosRequest.orderCode}&returnUrl={payosRequest.returnUrl}";
        var signature = GenerateSignature(signatureData, checksumKey);

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

        var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/v2/payment-requests");
        requestMessage.Headers.Add("x-client-id", _configuration["PayOSSettings:ClientId"]);
        requestMessage.Headers.Add("x-api-key", apiKey);
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
            return new PaymentDataDto
            {
                CheckoutUrl = payosResponse.Data.CheckoutUrl,
                OrderCode = orderCode.ToString(),
                QrCode = payosResponse.Data.QrCode ?? "",
                AccountNumber = payosResponse.Data.AccountNumber ?? "",
                AccountName = payosResponse.Data.AccountName ?? "",
                ExpiresAt = payosRequest.expiredAt
            };
        }
        else
        {
            throw new Exception(payosResponse?.Desc ?? "Failed to create payment link");
        }
    }

    private string GenerateSignature(string data, string key)
    {
        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key)))
        {
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }

    public async Task<List<OrderListDto>> GetOwnerOrdersAsync(int ownerId, string? status = null, int? storeId = null)
    {
        return await _orderRepository.GetOwnerOrdersAsync(ownerId, status, storeId);
    }

    public async Task<OrderListDto?> GetOrderByIdAsync(int orderId, int ownerId)
    {
        return await _orderRepository.GetOrderByIdAsync(orderId, ownerId);
    }

    public async Task<bool> ConfirmOrderAsync(int orderId, int ownerId)
    {
        return await _orderRepository.UpdateOrderStatusAsync(orderId, ownerId, "CONFIRMED");
    }

    public async Task<bool> StartPreparingAsync(int orderId, int ownerId)
    {
        return await _orderRepository.UpdateOrderStatusAsync(orderId, ownerId, "PREPARING");
    }

    public async Task<bool> MarkReadyAsync(int orderId, int ownerId)
    {
        return await _orderRepository.UpdateOrderStatusAsync(orderId, ownerId, "READY");
    }

    public async Task<bool> CancelOrderAsync(int orderId, int ownerId)
    {
        return await _orderRepository.UpdateOrderStatusAsync(orderId, ownerId, "CANCELLED");
    }

    public async Task<List<ShipperDto>> GetNearbyShippersAsync(int orderId, int ownerId, int radiusMeters = 5000)
    {
        var order = await _orderRepository.GetOrderByIdAsync(orderId, ownerId);
        if (order == null)
            return new List<ShipperDto>();

        return await _orderRepository.GetNearbyShippersAsync(
            order.StoreLatitude,
            order.StoreLongitude,
            radiusMeters
        );
    }

    public async Task<bool> AssignShipperAsync(int orderId, int ownerId, int shipperId)
    {
        return await _orderRepository.AssignShipperAsync(orderId, ownerId, shipperId);
    }

    public async Task<List<OrderHistoryDto>> GetCustomerOrderHistoryAsync(int customerId, string? status = null, int pageNumber = 1, int pageSize = 20)
    {
        return await _orderRepository.GetCustomerOrderHistoryAsync(customerId, status, pageNumber, pageSize);
    }

    public async Task<OrderHistoryDto?> GetCustomerOrderByIdAsync(int orderId, int customerId)
    {
        return await _orderRepository.GetCustomerOrderByIdAsync(orderId, customerId);
    }

    public async Task<ShipperTrackingDto?> GetShipperTrackingAsync(int orderId, int customerId)
    {
        // Verify order belongs to customer
        var order = await _context.Orders
            .Include(o => o.Shipper)
                .ThenInclude(s => s!.ShipperProfiles)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.CustomerId == customerId);

        if (order == null)
        {
            throw new UnauthorizedAccessException("Order not found or access denied");
        }

        // Check if order has a shipper assigned
        if (order.ShipperId == null || order.Shipper == null)
        {
            return null; // No shipper assigned yet
        }

        // Check if order is in a deliverable status
        var trackableStatuses = new[] { "DELIVERING", "PICKED_UP", "READY" };
        if (!trackableStatuses.Contains(order.Status))
        {
            return null; // Order not in trackable status
        }

        var shipperProfile = order.Shipper.ShipperProfiles.FirstOrDefault();

        return new ShipperTrackingDto
        {
            ShipperId = order.Shipper.UserId,
            ShipperName = order.Shipper.FullName,
            ShipperPhone = order.Shipper.PhoneNumber,
            ShipperAvatar = order.Shipper.AvatarUrl,
            VehiclePlate = shipperProfile?.VehiclePlate,
            CurrentLat = shipperProfile?.CurrentLat,
            CurrentLong = shipperProfile?.CurrentLong,
            FormattedAddress = shipperProfile?.FormattedAddress,
            LastLocationUpdate = shipperProfile?.LastLocationUpdate,
            IsOnline = shipperProfile?.IsOnline ?? false,
            OrderStatus = order.Status,
            DeliveryAddress = order.DeliveryAddress
        };
    }
}
