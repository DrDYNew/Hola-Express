#nullable disable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Models;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/vouchers")]
public class VouchersController : ControllerBase
{
    private readonly HolaExpressContext _context;
    private readonly ILogger<VouchersController> _logger;

    public VouchersController(HolaExpressContext context, ILogger<VouchersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out int userId) ? userId : null;
    }

    /// <summary>
    /// Kiểm tra và áp dụng voucher
    /// </summary>
    [HttpPost("validate")]
    [AllowAnonymous]
    public async Task<ActionResult> ValidateVoucher([FromBody] VoucherValidationRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Code))
            {
                return BadRequest(new { message = "Vui lòng nhập mã voucher" });
            }

            var now = DateTime.Now;

            // Tìm voucher
            var voucher = await _context.Vouchers
                .Include(v => v.Orders)
                .FirstOrDefaultAsync(v => v.Code == request.Code.ToUpper());

            if (voucher == null)
            {
                return BadRequest(new { message = "Mã voucher không tồn tại" });
            }

            // Kiểm tra trạng thái
            if (voucher.IsActive != true)
            {
                return BadRequest(new { message = "Voucher không hoạt động" });
            }

            // Kiểm tra thời gian
            if (voucher.StartDate.HasValue && voucher.StartDate > now)
            {
                return BadRequest(new { message = "Voucher chưa bắt đầu" });
            }

            if (voucher.EndDate.HasValue && voucher.EndDate <= now)
            {
                return BadRequest(new { message = "Voucher đã hết hạn" });
            }

            // Kiểm tra số lần sử dụng
            if (voucher.UsageLimit.HasValue && voucher.Orders.Count >= voucher.UsageLimit.Value)
            {
                return BadRequest(new { message = "Voucher đã hết lượt sử dụng" });
            }

            // Kiểm tra đơn tối thiểu
            if (voucher.MinOrderValue.HasValue && request.OrderAmount < voucher.MinOrderValue.Value)
            {
                return BadRequest(new { 
                    message = $"Đơn hàng phải tối thiểu {voucher.MinOrderValue.Value.ToString("N0")}đ" 
                });
            }

            // Tính toán giảm giá
            decimal discountAmount = 0;
            if (voucher.DiscountType == "PERCENTAGE")
            {
                discountAmount = (request.OrderAmount * voucher.DiscountValue) / 100;
                
                // Kiểm tra giảm tối đa
                if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount.Value)
                {
                    discountAmount = voucher.MaxDiscountAmount.Value;
                }
            }
            else if (voucher.DiscountType == "FIXED_AMOUNT")
            {
                discountAmount = voucher.DiscountValue;
            }

            return Ok(new
            {
                success = true,
                message = "Áp dụng voucher thành công",
                discount = discountAmount,
                voucher = new VoucherDto
                {
                    VoucherId = voucher.VoucherId,
                    Code = voucher.Code,
                    DiscountType = voucher.DiscountType ?? "PERCENTAGE",
                    DiscountValue = voucher.DiscountValue,
                    MaxDiscountAmount = voucher.MaxDiscountAmount,
                    MinOrderValue = voucher.MinOrderValue,
                    UsageLimit = voucher.UsageLimit,
                    UsedCount = voucher.Orders.Count,
                    StartDate = voucher.StartDate ?? DateTime.Now,
                    EndDate = voucher.EndDate ?? DateTime.Now.AddDays(30),
                    IsActive = voucher.IsActive ?? true,
                    StoreId = voucher.StoreId
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating voucher");
            return StatusCode(500, new { message = "Lỗi khi kiểm tra voucher" });
        }
    }

    /// <summary>
    /// Kiểm tra voucher từ cửa hàng cụ thể
    /// </summary>
    [HttpGet("store/{storeId}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<VoucherDto>>> GetStoreVouchers(int storeId)
    {
        try
        {
            var now = DateTime.Now;

            var vouchers = await _context.Vouchers
                .Where(v => (v.StoreId == storeId || v.StoreId == null) &&
                           v.IsActive == true &&
                           (v.StartDate == null || v.StartDate <= now) &&
                           (v.EndDate == null || v.EndDate > now))
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store vouchers for store {StoreId}", storeId);
            return StatusCode(500, new { message = "Lỗi khi tải voucher của cửa hàng" });
        }
    }
}

public class VoucherValidationRequest
{
    public string Code { get; set; }
    public decimal OrderAmount { get; set; }
    public int? StoreId { get; set; }
}
