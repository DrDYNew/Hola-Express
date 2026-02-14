using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.RoleApplication;
using HolaExpress_BE.Interfaces;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoleApplicationController : ControllerBase
{
    private readonly IRoleApplicationService _roleApplicationService;
    private readonly ILogger<RoleApplicationController> _logger;

    public RoleApplicationController(
        IRoleApplicationService roleApplicationService,
        ILogger<RoleApplicationController> logger)
    {
        _roleApplicationService = roleApplicationService;
        _logger = logger;
    }

    /// <summary>
    /// Đăng ký làm Shipper
    /// </summary>
    [HttpPost("apply-shipper")]
    public async Task<IActionResult> ApplyForShipper([FromBody] ApplyForShipperDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Dữ liệu không hợp lệ",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được người dùng" });
            }

            var result = await _roleApplicationService.ApplyForShipperAsync(userId, dto);

            return Ok(new
            {
                success = true,
                message = "Đăng ký làm shipper thành công. Vui lòng chờ admin phê duyệt.",
                data = result
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Apply shipper failed: {Message}", ex.Message);
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying for shipper");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi trong quá trình đăng ký"
            });
        }
    }

    /// <summary>
    /// Đăng ký làm Owner (Chủ quán)
    /// </summary>
    [HttpPost("apply-owner")]
    public async Task<IActionResult> ApplyForOwner([FromBody] ApplyForOwnerDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Dữ liệu không hợp lệ",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được người dùng" });
            }

            var result = await _roleApplicationService.ApplyForOwnerAsync(userId, dto);

            return Ok(new
            {
                success = true,
                message = "Đăng ký làm chủ quán thành công. Vui lòng chờ admin phê duyệt.",
                data = result
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Apply owner failed: {Message}", ex.Message);
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying for owner");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi trong quá trình đăng ký"
            });
        }
    }

    /// <summary>
    /// Lấy danh sách đơn đăng ký của user hiện tại
    /// </summary>
    [HttpGet("my-applications")]
    public async Task<IActionResult> GetMyApplications()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được người dùng" });
            }

            var result = await _roleApplicationService.GetUserApplicationsAsync(userId);

            return Ok(new
            {
                success = true,
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user applications");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi"
            });
        }
    }

    /// <summary>
    /// Lấy thông tin chi tiết một đơn đăng ký
    /// </summary>
    [HttpGet("{applicationId}")]
    public async Task<IActionResult> GetApplicationById(int applicationId)
    {
        try
        {
            var result = await _roleApplicationService.GetApplicationByIdAsync(applicationId);

            return Ok(new
            {
                success = true,
                data = result
            });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application {ApplicationId}", applicationId);
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi"
            });
        }
    }

    /// <summary>
    /// [ADMIN] Lấy tất cả đơn đăng ký đang pending
    /// </summary>
    [HttpGet("admin/pending")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetPendingApplications()
    {
        try
        {
            var result = await _roleApplicationService.GetAllPendingApplicationsAsync();

            return Ok(new
            {
                success = true,
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending applications");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi"
            });
        }
    }

    /// <summary>
    /// [ADMIN] Lấy đơn đăng ký theo trạng thái
    /// </summary>
    [HttpGet("admin/by-status/{status}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetApplicationsByStatus(string status)
    {
        try
        {
            var result = await _roleApplicationService.GetApplicationsByStatusAsync(status.ToUpper());

            return Ok(new
            {
                success = true,
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications by status {Status}", status);
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi"
            });
        }
    }

    /// <summary>
    /// [ADMIN] Xử lý đơn đăng ký (Duyệt hoặc Từ chối)
    /// </summary>
    [HttpPost("admin/process")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ProcessApplication([FromBody] ProcessApplicationDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Dữ liệu không hợp lệ",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (adminId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được admin" });
            }

            var result = await _roleApplicationService.ProcessApplicationAsync(adminId, dto);

            var message = dto.Status == "APPROVED" 
                ? "Đã phê duyệt đơn đăng ký thành công" 
                : "Đã từ chối đơn đăng ký";

            return Ok(new
            {
                success = true,
                message = message,
                data = result
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Process application failed: {Message}", ex.Message);
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing application");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi trong quá trình xử lý"
            });
        }
    }
}
