using HolaExpress_BE.DTOs.Wallet;
using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly ILogger<WalletController> _logger;

    public WalletController(IWalletService walletService, ILogger<WalletController> logger)
    {
        _walletService = walletService;
        _logger = logger;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }
        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        try
        {
            var userId = GetUserId();
            var wallet = await _walletService.GetWalletAsync(userId);
            
            return Ok(new
            {
                success = true,
                data = wallet,
                message = "Wallet retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting wallet");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactionHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetUserId();
            var history = await _walletService.GetTransactionHistoryAsync(userId, page, pageSize);
            
            return Ok(new
            {
                success = true,
                data = history,
                message = "Transaction history retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction history");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpPost("top-up")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequestDto request)
    {
        try
        {
            var userId = GetUserId();
            var paymentData = await _walletService.CreateTopUpPaymentAsync(userId, request);
            
            return Ok(new
            {
                success = true,
                data = paymentData,
                message = "Payment link created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during top up");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpGet("verify-payment/{orderCode}")]
    public async Task<IActionResult> VerifyPayment(string orderCode)
    {
        try
        {
            var result = await _walletService.VerifyTopUpPaymentAsync(orderCode);
            
            return Ok(new
            {
                success = true,
                data = new
                {
                    status = result ? "Success" : "Pending"
                },
                message = result ? "Payment completed" : "Payment pending"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequestDto request)
    {
        try
        {
            var userId = GetUserId();
            var wallet = await _walletService.WithdrawAsync(userId, request);
            
            return Ok(new
            {
                success = true,
                data = wallet,
                message = "Withdrawal successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during withdrawal");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }
}
