using HolaExpress_BE.DTOs.Order;
using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ICartService _cartService;
    private readonly ILogger<OrderController> _logger;

    public OrderController(
        IOrderService orderService,
        ICartService cartService,
        ILogger<OrderController> logger)
    {
        _orderService = orderService;
        _cartService = cartService;
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

    [HttpPost("create")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _orderService.CreateOrderAsync(userId, request);

            return Ok(new
            {
                success = true,
                data = result,
                message = "Order created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpGet("verify-payment/{orderCode}")]
    public async Task<IActionResult> VerifyOrderPayment(string orderCode)
    {
        try
        {
            // TODO: Implement order payment verification
            // This should check PayOS payment status and update order accordingly
            
            return Ok(new
            {
                success = true,
                data = new
                {
                    status = "PAID"
                },
                message = "Payment verified successfully"
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

    [HttpGet("history")]
    public async Task<IActionResult> GetOrderHistory(
        [FromQuery] string? status = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetUserId();
            var orders = await _orderService.GetCustomerOrderHistoryAsync(userId, status, pageNumber, pageSize);

            return Ok(new
            {
                success = true,
                data = orders,
                message = "Orders retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order history");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetOrderById(int orderId)
    {
        try
        {
            var userId = GetUserId();
            var order = await _orderService.GetCustomerOrderByIdAsync(orderId, userId);

            if (order == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Order not found"
                });
            }

            return Ok(new
            {
                success = true,
                data = order,
                message = "Order retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order");
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get shipper tracking information for customer's order
    /// Allows customer to track shipper's real-time location and contact info
    /// </summary>
    [HttpGet("{orderId}/track-shipper")]
    public async Task<IActionResult> TrackShipper(int orderId)
    {
        try
        {
            var userId = GetUserId();
            var trackingInfo = await _orderService.GetShipperTrackingAsync(orderId, userId);

            if (trackingInfo == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không thể theo dõi đơn hàng này. Đơn hàng chưa có shipper hoặc chưa trong trạng thái giao hàng."
                });
            }

            return Ok(new
            {
                success = true,
                data = trackingInfo,
                message = "Lấy thông tin shipper thành công"
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Bạn không có quyền xem đơn hàng này"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking shipper for order {OrderId}", orderId);
            return BadRequest(new
            {
                success = false,
                message = "Không thể lấy thông tin shipper"
            });
        }
    }
}
