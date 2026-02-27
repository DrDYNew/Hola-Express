using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/role-applications")]
    [Authorize(Roles = "ADMIN")]
    public class AdminRoleApplicationController : ControllerBase
    {
        private readonly IAdminRoleApplicationService _service;
        private readonly ILogger<AdminRoleApplicationController> _logger;

        public AdminRoleApplicationController(
            IAdminRoleApplicationService service,
            ILogger<AdminRoleApplicationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Danh sách đơn đăng ký vai trò (có search + filter + phân trang)
        /// GET /api/admin/role-applications?page=1&limit=10&status=PENDING&requestedRole=SHIPPER&search=nguyen
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetApplications([FromQuery] AdminRoleApplicationFilterDto filter)
        {
            try
            {
                if (filter.Page < 1) filter.Page = 1;
                if (filter.Limit < 1) filter.Limit = 10;

                var result = await _service.GetApplicationsAsync(filter);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching role applications list");
                return StatusCode(500, new { success = false, message = "Không thể tải danh sách đơn đăng ký" });
            }
        }

        /// <summary>
        /// Thống kê số đơn theo trạng thái
        /// GET /api/admin/role-applications/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var stats = await _service.GetApplicationCountByStatusAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching role application stats");
                return StatusCode(500, new { success = false, message = "Không thể tải thống kê" });
            }
        }

        /// <summary>
        /// Chi tiết một đơn đăng ký
        /// GET /api/admin/role-applications/{id}
        /// </summary>
        [HttpGet("{applicationId:int}")]
        public async Task<IActionResult> GetApplicationDetail(int applicationId)
        {
            try
            {
                var result = await _service.GetApplicationDetailAsync(applicationId);
                return Ok(new { success = true, data = result });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching role application detail {ApplicationId}", applicationId);
                return StatusCode(500, new { success = false, message = "Không thể tải chi tiết đơn đăng ký" });
            }
        }

        /// <summary>
        /// Duyệt hoặc từ chối đơn đăng ký
        /// PUT /api/admin/role-applications/{id}/process
        /// Body: { "status": "APPROVED" | "REJECTED", "adminNotes": "...", "rejectionReason": "..." }
        /// </summary>
        [HttpPut("{applicationId:int}/process")]
        public async Task<IActionResult> ProcessApplication(int applicationId, [FromBody] AdminProcessApplicationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });

                var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (adminId == 0)
                    return Unauthorized(new { success = false, message = "Không xác định được admin" });

                var result = await _service.ProcessApplicationAsync(applicationId, adminId, dto);

                var message = dto.Status?.ToUpper() == "APPROVED"
                    ? "Đã phê duyệt đơn đăng ký thành công"
                    : "Đã từ chối đơn đăng ký";

                return Ok(new { success = true, message, data = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing role application {ApplicationId}", applicationId);
                return StatusCode(500, new { success = false, message = "Không thể xử lý đơn đăng ký" });
            }
        }
    }
}
