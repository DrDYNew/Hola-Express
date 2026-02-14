#nullable disable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Owner;

[ApiController]
[Route("api/owner")]
[Authorize(Roles = "OWNER")]
public class OwnerController : ControllerBase
{
    private readonly IOwnerService _ownerService;
    private readonly ILogger<OwnerController> _logger;

    public OwnerController(IOwnerService ownerService, ILogger<OwnerController> logger)
    {
        _ownerService = ownerService;
        _logger = logger;
    }

    private int GetOwnerId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out int userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Invalid user ID");
    }

    /// <summary>
    /// Lấy toàn bộ dữ liệu dashboard cho Owner
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<OwnerDashboardDto>> GetDashboard([FromQuery] int? storeId = null)
    {
        try
        {
            var ownerId = GetOwnerId();
            var dashboard = await _ownerService.GetDashboardDataAsync(ownerId, storeId);
            
            if (dashboard == null)
            {
                return NotFound(new { message = "Không tìm thấy cửa hàng" });
            }

            return Ok(dashboard);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to dashboard");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard data");
            return StatusCode(500, new { message = "Lỗi server khi tải dữ liệu dashboard" });
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan
    /// </summary>
    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats([FromQuery] int? storeId = null)
    {
        try
        {
            var ownerId = GetOwnerId();
            var stats = await _ownerService.GetDashboardStatsAsync(ownerId, storeId);
            
            if (stats == null)
            {
                return NotFound(new { message = "Không tìm thấy cửa hàng" });
            }

            return Ok(stats);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to stats");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stats");
            return StatusCode(500, new { message = "Lỗi server khi tải thống kê" });
        }
    }

    /// <summary>
    /// Lấy danh sách đơn hàng gần đây
    /// </summary>
    [HttpGet("dashboard/recent-orders")]
    public async Task<ActionResult<List<RecentOrderDto>>> GetRecentOrders(
        [FromQuery] int? storeId = null, 
        [FromQuery] int limit = 10)
    {
        try
        {
            var ownerId = GetOwnerId();
            var orders = await _ownerService.GetRecentOrdersAsync(ownerId, storeId, limit);
            return Ok(orders);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to recent orders");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent orders");
            return StatusCode(500, new { message = "Lỗi server khi tải đơn hàng" });
        }
    }

    /// <summary>
    /// Lấy danh sách sản phẩm bán chạy
    /// </summary>
    [HttpGet("dashboard/top-products")]
    public async Task<ActionResult<List<TopSellingProductDto>>> GetTopProducts(
        [FromQuery] int? storeId = null, 
        [FromQuery] int limit = 5)
    {
        try
        {
            var ownerId = GetOwnerId();
            var products = await _ownerService.GetTopSellingProductsAsync(ownerId, storeId, limit);
            return Ok(products);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to top products");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top products");
            return StatusCode(500, new { message = "Lỗi server khi tải sản phẩm bán chạy" });
        }
    }

    /// <summary>
    /// Lấy báo cáo doanh thu theo khoảng thời gian
    /// </summary>
    [HttpGet("revenue-report")]
    public async Task<ActionResult<RevenueReportDto>> GetRevenueReport(
        [FromQuery] string period = "today",
        [FromQuery] int? storeId = null)
    {
        try
        {
            var ownerId = GetOwnerId();
            var report = await _ownerService.GetRevenueReportAsync(ownerId, period, storeId);
            
            if (report == null)
            {
                return NotFound(new { message = "Không tìm thấy dữ liệu báo cáo" });
            }

            return Ok(report);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to revenue report");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue report");
            return StatusCode(500, new { message = "Lỗi server khi tải báo cáo doanh thu" });
        }
    }
}
