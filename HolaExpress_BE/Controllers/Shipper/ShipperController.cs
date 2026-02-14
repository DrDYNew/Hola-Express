using HolaExpress_BE.DTOs.Shipper;
using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Shipper;

[ApiController]
[Route("api/shipper")]
[Authorize(Roles = "SHIPPER")]
public class ShipperController : ControllerBase
{
    private readonly IShipperService _shipperService;
    private readonly ILogger<ShipperController> _logger;

    public ShipperController(
        IShipperService shipperService,
        ILogger<ShipperController> logger)
    {
        _shipperService = shipperService;
        _logger = logger;
    }

    private int GetShipperId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var shipperId) ? shipperId : 0;
    }

    /// <summary>
    /// Get shipper dashboard data
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<ShipperDashboardDto>> GetDashboard()
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var dashboard = await _shipperService.GetDashboardAsync(shipperId);
            
            if (dashboard == null)
                return NotFound(new { message = "Không tìm thấy thông tin shipper" });

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipper dashboard");
            return StatusCode(500, new { message = "Không thể tải dữ liệu dashboard" });
        }
    }

    /// <summary>
    /// Get available orders near shipper location
    /// </summary>
    [HttpGet("orders/available")]
    public async Task<ActionResult<List<ShipperOrderDto>>> GetAvailableOrders(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] int radius = 5000)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var orders = await _shipperService.GetAvailableOrdersAsync(shipperId, latitude, longitude, radius);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available orders");
            return StatusCode(500, new { message = "Không thể tải danh sách đơn hàng" });
        }
    }

    /// <summary>
    /// Get shipper's current orders
    /// </summary>
    [HttpGet("orders/current")]
    public async Task<ActionResult<List<ShipperOrderDto>>> GetCurrentOrders()
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var dashboard = await _shipperService.GetDashboardAsync(shipperId);
            
            if (dashboard == null)
                return NotFound(new { message = "Không tìm thấy thông tin shipper" });

            return Ok(dashboard.CurrentOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current orders");
            return StatusCode(500, new { message = "Không thể tải đơn hàng hiện tại" });
        }
    }

    /// <summary>
    /// Get order history
    /// </summary>
    [HttpGet("orders/history")]
    public async Task<ActionResult<List<ShipperOrderDto>>> GetOrderHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var orders = await _shipperService.GetOrderHistoryAsync(shipperId, page, pageSize);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order history");
            return StatusCode(500, new { message = "Không thể tải lịch sử đơn hàng" });
        }
    }

    /// <summary>
    /// Get shipper earnings
    /// </summary>
    [HttpGet("earnings")]
    public async Task<ActionResult<ShipperEarningsDto>> GetEarnings()
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var earnings = await _shipperService.GetEarningsAsync(shipperId);
            
            if (earnings == null)
                return NotFound(new { message = "Không tìm thấy thông tin thu nhập" });

            return Ok(earnings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting earnings");
            return StatusCode(500, new { message = "Không thể tải thông tin thu nhập" });
        }
    }

    /// <summary>
    /// Update shipper online status and location
    /// </summary>
    [HttpPatch("status")]
    public async Task<ActionResult> UpdateStatus([FromBody] UpdateStatusRequest request)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var result = await _shipperService.UpdateStatusAsync(
                shipperId, 
                request.IsOnline, 
                request.Latitude, 
                request.Longitude);

            if (!result)
                return BadRequest(new { message = "Không thể cập nhật trạng thái" });

            return Ok(new { message = "Đã cập nhật trạng thái thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status");
            return StatusCode(500, new { message = "Không thể cập nhật trạng thái" });
        }
    }

    /// <summary>
    /// Accept an order
    /// </summary>
    [HttpPost("orders/{orderId}/accept")]
    public async Task<ActionResult> AcceptOrder(int orderId)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var result = await _shipperService.AcceptOrderAsync(orderId, shipperId);

            if (!result)
                return BadRequest(new { message = "Không thể nhận đơn hàng. Đơn hàng có thể đã được nhận bởi shipper khác" });

            return Ok(new { message = "Đã nhận đơn hàng thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể nhận đơn hàng" });
        }
    }

    /// <summary>
    /// Update order status
    /// </summary>
    [HttpPatch("orders/{orderId}/status")]
    public async Task<ActionResult> UpdateOrderStatus(
        int orderId, 
        [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var result = await _shipperService.UpdateOrderStatusAsync(orderId, shipperId, request.Status);

            if (!result)
                return BadRequest(new { message = "Không thể cập nhật trạng thái đơn hàng" });

            return Ok(new { message = "Đã cập nhật trạng thái đơn hàng" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể cập nhật trạng thái đơn hàng" });
        }
    }

    /// <summary>
    /// Update shipper current location
    /// This endpoint should be called periodically while shipper is delivering
    /// </summary>
    [HttpPut("location")]
    public async Task<ActionResult> UpdateLocation([FromBody] UpdateLocationDto locationDto)
    {
        try
        {
            var shipperId = GetShipperId();
            if (shipperId == 0)
                return Unauthorized(new { message = "Invalid shipper ID" });

            var result = await _shipperService.UpdateLocationAsync(shipperId, locationDto);

            if (!result)
                return BadRequest(new { message = "Không thể cập nhật vị trí" });

            return Ok(new 
            { 
                success = true,
                message = "Đã cập nhật vị trí thành công",
                data = new
                {
                    latitude = locationDto.Latitude,
                    longitude = locationDto.Longitude,
                    updatedAt = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shipper location");
            return StatusCode(500, new { message = "Không thể cập nhật vị trí" });
        }
    }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
