using HolaExpress_BE.DTOs.Order;
using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Owner;

[Authorize(Roles = "OWNER")]
[ApiController]
[Route("api/owner/orders")]
public class OrderManagementController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderManagementController> _logger;

    public OrderManagementController(
        IOrderService orderService,
        ILogger<OrderManagementController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    private int GetOwnerId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderListDto>>> GetOrders(
        [FromQuery] string? status = null,
        [FromQuery] int? storeId = null)
    {
        try
        {
            var ownerId = GetOwnerId();
            var orders = await _orderService.GetOwnerOrdersAsync(ownerId, status, storeId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return StatusCode(500, new { message = "Không thể tải danh sách đơn hàng" });
        }
    }

    [HttpGet("{orderId}")]
    public async Task<ActionResult<OrderListDto>> GetOrderById(int orderId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var order = await _orderService.GetOrderByIdAsync(orderId, ownerId);

            if (order == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể tải thông tin đơn hàng" });
        }
    }

    [HttpPatch("{orderId}/confirm")]
    public async Task<ActionResult> ConfirmOrder(int orderId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _orderService.ConfirmOrderAsync(orderId, ownerId);

            if (!result)
                return NotFound(new { message = "Không tìm thấy đơn hàng hoặc không thể xác nhận" });

            return Ok(new { message = "Đã xác nhận đơn hàng thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể xác nhận đơn hàng" });
        }
    }

    [HttpPatch("{orderId}/preparing")]
    public async Task<ActionResult> StartPreparing(int orderId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _orderService.StartPreparingAsync(orderId, ownerId);

            if (!result)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });

            return Ok(new { message = "Đã bắt đầu làm đơn hàng" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting preparation for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể cập nhật trạng thái" });
        }
    }

    [HttpPatch("{orderId}/ready")]
    public async Task<ActionResult> MarkReady(int orderId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _orderService.MarkReadyAsync(orderId, ownerId);

            if (!result)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });

            return Ok(new { message = "Đơn hàng đã sẵn sàng giao" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking order {OrderId} as ready", orderId);
            return StatusCode(500, new { message = "Không thể cập nhật trạng thái" });
        }
    }

    [HttpPatch("{orderId}/cancel")]
    public async Task<ActionResult> CancelOrder(int orderId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _orderService.CancelOrderAsync(orderId, ownerId);

            if (!result)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });

            return Ok(new { message = "Đã hủy đơn hàng" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể hủy đơn hàng" });
        }
    }

    [HttpGet("{orderId}/nearby-shippers")]
    public async Task<ActionResult<List<ShipperDto>>> GetNearbyShippers(
        int orderId,
        [FromQuery] int radius = 5000)
    {
        try
        {
            var ownerId = GetOwnerId();
            var shippers = await _orderService.GetNearbyShippersAsync(orderId, ownerId, radius);
            return Ok(shippers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby shippers for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể tải danh sách shipper" });
        }
    }

    [HttpPatch("{orderId}/assign-shipper")]
    public async Task<ActionResult> AssignShipper(int orderId, [FromBody] AssignShipperRequest request)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _orderService.AssignShipperAsync(orderId, ownerId, request.ShipperId);

            if (!result)
                return BadRequest(new { message = "Không thể gán shipper. Kiểm tra trạng thái đơn hàng và shipper" });

            return Ok(new { message = "Đã gán shipper thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning shipper to order {OrderId}", orderId);
            return StatusCode(500, new { message = "Không thể gán shipper" });
        }
    }
}
