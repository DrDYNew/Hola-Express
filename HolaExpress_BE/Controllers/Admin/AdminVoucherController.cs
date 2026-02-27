#nullable disable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Controllers.Admin;

[ApiController]
[Route("api/admin/vouchers")]
[Authorize(Roles = "ADMIN")]
public class AdminVoucherController : ControllerBase
{
    private readonly IAdminVoucherService _service;
    private readonly ILogger<AdminVoucherController> _logger;

    public AdminVoucherController(IAdminVoucherService service, ILogger<AdminVoucherController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách voucher hệ thống (có filter, phân trang)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<AdminVoucherListResultDto>> GetVouchers([FromQuery] AdminVoucherFilterDto filter)
    {
        try
        {
            var result = await _service.GetVouchersAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin vouchers");
            return StatusCode(500, new { message = "Lỗi server khi tải danh sách voucher" });
        }
    }

    /// <summary>
    /// Lấy chi tiết một voucher hệ thống
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AdminVoucherDetailDto>> GetVoucherById(int id)
    {
        try
        {
            var voucher = await _service.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound(new { message = "Không tìm thấy voucher" });
            return Ok(voucher);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting voucher {Id}", id);
            return StatusCode(500, new { message = "Lỗi server" });
        }
    }

    /// <summary>
    /// Tạo voucher hệ thống mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AdminVoucherDetailDto>> CreateVoucher([FromBody] CreateAdminVoucherDto dto)
    {
        try
        {
            var (success, error, voucher) = await _service.CreateVoucherAsync(dto);
            if (!success)
                return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetVoucherById), new { id = voucher!.VoucherId }, voucher);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating voucher");
            return StatusCode(500, new { message = "Lỗi server khi tạo voucher" });
        }
    }

    /// <summary>
    /// Cập nhật voucher hệ thống
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateVoucher(int id, [FromBody] UpdateAdminVoucherDto dto)
    {
        try
        {
            var (success, error) = await _service.UpdateVoucherAsync(id, dto);
            if (!success)
                return BadRequest(new { message = error });
            return Ok(new { message = "Cập nhật voucher thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating voucher {Id}", id);
            return StatusCode(500, new { message = "Lỗi server khi cập nhật voucher" });
        }
    }

    /// <summary>
    /// Bật/tắt trạng thái hoạt động của voucher
    /// </summary>
    [HttpPut("{id}/toggle-status")]
    public async Task<ActionResult> ToggleVoucherStatus(int id)
    {
        try
        {
            var (success, error) = await _service.ToggleVoucherStatusAsync(id);
            if (!success)
                return BadRequest(new { message = error });
            return Ok(new { message = "Cập nhật trạng thái voucher thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling voucher status {Id}", id);
            return StatusCode(500, new { message = "Lỗi server" });
        }
    }

    /// <summary>
    /// Xóa voucher hệ thống
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteVoucher(int id)
    {
        try
        {
            var (success, error) = await _service.DeleteVoucherAsync(id);
            if (!success)
                return BadRequest(new { message = error });
            return Ok(new { message = "Xóa voucher thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting voucher {Id}", id);
            return StatusCode(500, new { message = "Lỗi server khi xóa voucher" });
        }
    }
}
