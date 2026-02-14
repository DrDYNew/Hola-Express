#nullable disable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Models;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Owner;

[ApiController]
[Route("api/owner/vouchers")]
[Authorize(Roles = "OWNER")]
public class VoucherController : ControllerBase
{
    private readonly HolaExpressContext _context;
    private readonly ILogger<VoucherController> _logger;

    public VoucherController(HolaExpressContext context, ILogger<VoucherController> logger)
    {
        _context = context;
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
    /// Lấy danh sách voucher của owner
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<VoucherDto>>> GetVouchers([FromQuery] int? storeId = null)
    {
        try
        {
            var ownerId = GetOwnerId();
            
            var storesQuery = _context.Stores.Where(s => s.OwnerId == ownerId);
            if (storeId.HasValue)
            {
                storesQuery = storesQuery.Where(s => s.StoreId == storeId.Value);
            }

            var storeIds = await storesQuery.Select(s => s.StoreId).ToListAsync();

            var vouchers = await _context.Vouchers
                .Where(v => storeIds.Contains(v.StoreId.Value) || v.StoreId == null)
                .Select(v => new VoucherDto
                {
                    VoucherId = v.VoucherId,
                    Code = v.Code,
                    DiscountType = v.DiscountType ?? "PERCENTAGE",
                    DiscountValue = v.DiscountValue,
                    MaxDiscountAmount = v.MaxDiscountAmount,
                    MinOrderValue = v.MinOrderValue,
                    UsageLimit = v.UsageLimit,
                    UsedCount = v.Orders.Count,
                    StartDate = v.StartDate ?? DateTime.Now,
                    EndDate = v.EndDate ?? DateTime.Now.AddDays(30),
                    IsActive = v.IsActive ?? true,
                    StoreId = v.StoreId
                })
                .OrderByDescending(v => v.VoucherId)
                .ToListAsync();

            return Ok(vouchers);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vouchers");
            return StatusCode(500, new { message = "Lỗi server khi tải danh sách voucher" });
        }
    }

    /// <summary>
    /// Tạo voucher mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<VoucherDto>> CreateVoucher([FromBody] CreateVoucherDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();

            // Validate store ownership if storeId is provided
            if (dto.StoreId.HasValue)
            {
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => s.StoreId == dto.StoreId.Value && s.OwnerId == ownerId);
                    
                if (store == null)
                {
                    return NotFound(new { message = "Không tìm thấy cửa hàng" });
                }
            }

            // Check if code already exists
            var existingVoucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Code == dto.Code);
                
            if (existingVoucher != null)
            {
                return BadRequest(new { message = "Mã voucher đã tồn tại" });
            }

            var voucher = new Voucher
            {
                Code = dto.Code,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                MinOrderValue = dto.MinOrderValue,
                UsageLimit = dto.UsageLimit,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive,
                StoreId = dto.StoreId
            };

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            var result = new VoucherDto
            {
                VoucherId = voucher.VoucherId,
                Code = voucher.Code,
                DiscountType = voucher.DiscountType ?? "PERCENTAGE",
                DiscountValue = voucher.DiscountValue,
                MaxDiscountAmount = voucher.MaxDiscountAmount,
                MinOrderValue = voucher.MinOrderValue,
                UsageLimit = voucher.UsageLimit,
                UsedCount = 0,
                StartDate = voucher.StartDate ?? DateTime.Now,
                EndDate = voucher.EndDate ?? DateTime.Now.AddDays(30),
                IsActive = voucher.IsActive ?? true,
                StoreId = voucher.StoreId
            };

            return CreatedAtAction(nameof(GetVouchers), new { id = voucher.VoucherId }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating voucher");
            return StatusCode(500, new { message = "Lỗi server khi tạo voucher" });
        }
    }

    /// <summary>
    /// Cập nhật voucher
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateVoucher(int id, [FromBody] UpdateVoucherDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();

            var voucher = await _context.Vouchers
                .Include(v => v.Store)
                .FirstOrDefaultAsync(v => v.VoucherId == id);

            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher" });
            }

            // Check ownership
            if (voucher.StoreId.HasValue)
            {
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => s.StoreId == voucher.StoreId.Value && s.OwnerId == ownerId);
                    
                if (store == null)
                {
                    return Forbid();
                }
            }

            if (dto.Code != null) voucher.Code = dto.Code;
            if (dto.DiscountType != null) voucher.DiscountType = dto.DiscountType;
            if (dto.DiscountValue.HasValue) voucher.DiscountValue = dto.DiscountValue.Value;
            if (dto.MaxDiscountAmount.HasValue) voucher.MaxDiscountAmount = dto.MaxDiscountAmount;
            if (dto.MinOrderValue.HasValue) voucher.MinOrderValue = dto.MinOrderValue;
            if (dto.UsageLimit.HasValue) voucher.UsageLimit = dto.UsageLimit;
            if (dto.StartDate.HasValue) voucher.StartDate = dto.StartDate;
            if (dto.EndDate.HasValue) voucher.EndDate = dto.EndDate;
            if (dto.IsActive.HasValue) voucher.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật voucher thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating voucher");
            return StatusCode(500, new { message = "Lỗi server khi cập nhật voucher" });
        }
    }

    /// <summary>
    /// Xóa voucher
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteVoucher(int id)
    {
        try
        {
            var ownerId = GetOwnerId();

            var voucher = await _context.Vouchers
                .Include(v => v.Store)
                .Include(v => v.Orders)
                .FirstOrDefaultAsync(v => v.VoucherId == id);

            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher" });
            }

            // Check ownership
            if (voucher.StoreId.HasValue)
            {
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => s.StoreId == voucher.StoreId.Value && s.OwnerId == ownerId);
                    
                if (store == null)
                {
                    return Forbid();
                }
            }

            // Check if voucher has been used
            if (voucher.Orders.Any())
            {
                return BadRequest(new { message = "Không thể xóa voucher đã được sử dụng" });
            }

            _context.Vouchers.Remove(voucher);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa voucher" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting voucher");
            return StatusCode(500, new { message = "Lỗi server khi xóa voucher" });
        }
    }

    /// <summary>
    /// Bật/tắt trạng thái voucher
    /// </summary>
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult> ToggleActive(int id)
    {
        try
        {
            var ownerId = GetOwnerId();

            var voucher = await _context.Vouchers
                .Include(v => v.Store)
                .FirstOrDefaultAsync(v => v.VoucherId == id);

            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher" });
            }

            // Check ownership
            if (voucher.StoreId.HasValue)
            {
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => s.StoreId == voucher.StoreId.Value && s.OwnerId == ownerId);
                    
                if (store == null)
                {
                    return Forbid();
                }
            }

            voucher.IsActive = !(voucher.IsActive ?? true);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã cập nhật trạng thái", isActive = voucher.IsActive });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling voucher");
            return StatusCode(500, new { message = "Lỗi server khi cập nhật trạng thái" });
        }
    }
}
