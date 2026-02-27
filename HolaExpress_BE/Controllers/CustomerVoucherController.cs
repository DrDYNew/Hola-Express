#nullable disable
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/vouchers")]
[Authorize]
public class CustomerVoucherController : ControllerBase
{
    private readonly HolaExpressContext _context;
    private readonly ILogger<CustomerVoucherController> _logger;

    public CustomerVoucherController(HolaExpressContext context, ILogger<CustomerVoucherController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy tất cả voucher còn hiệu lực của tất cả cửa hàng (dành cho khách hàng)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetAllVouchers()
    {
        try
        {
            var now = DateTime.Now;

            var vouchers = await _context.Vouchers
                .Include(v => v.Store)
                .Include(v => v.Orders)
                .Where(v =>
                    v.StoreId != null &&
                    (v.IsActive ?? false) &&
                    v.StartDate <= now &&
                    v.EndDate > now &&
                    (v.UsageLimit == null || v.Orders.Count < v.UsageLimit))
                .Select(v => new
                {
                    voucherId = v.VoucherId,
                    code = v.Code,
                    discountType = v.DiscountType ?? "PERCENTAGE",
                    discountValue = v.DiscountValue,
                    maxDiscountAmount = v.MaxDiscountAmount,
                    minOrderValue = v.MinOrderValue,
                    usageLimit = v.UsageLimit,
                    usedCount = v.Orders.Count,
                    startDate = v.StartDate,
                    endDate = v.EndDate,
                    isActive = v.IsActive ?? true,
                    storeId = v.StoreId,
                    storeName = v.Store != null ? v.Store.StoreName : null
                })
                .OrderByDescending(v => v.discountValue)
                .ToListAsync();

            return Ok(vouchers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all vouchers");
            return StatusCode(500, new { message = "Lỗi server khi tải danh sách voucher" });
        }
    }

    /// <summary>
    /// Lấy danh sách voucher còn hiệu lực của một cửa hàng (dành cho khách hàng)
    /// </summary>
    [HttpGet("store/{storeId}")]
    public async Task<ActionResult> GetStoreVouchers(int storeId)
    {
        try
        {
            var now = DateTime.Now;

            var vouchers = await _context.Vouchers
                .Include(v => v.Store)
                .Include(v => v.Orders)
                .Where(v =>
                    v.StoreId == storeId &&
                    (v.IsActive ?? false) &&
                    v.StartDate <= now &&
                    v.EndDate > now &&
                    (v.UsageLimit == null || v.Orders.Count < v.UsageLimit))
                .Select(v => new
                {
                    voucherId = v.VoucherId,
                    code = v.Code,
                    discountType = v.DiscountType ?? "PERCENTAGE",
                    discountValue = v.DiscountValue,
                    maxDiscountAmount = v.MaxDiscountAmount,
                    minOrderValue = v.MinOrderValue,
                    usageLimit = v.UsageLimit,
                    usedCount = v.Orders.Count,
                    startDate = v.StartDate,
                    endDate = v.EndDate,
                    isActive = v.IsActive ?? true,
                    storeId = v.StoreId,
                    storeName = v.Store != null ? v.Store.StoreName : null
                })
                .OrderByDescending(v => v.discountValue)
                .ToListAsync();

            return Ok(vouchers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store vouchers for storeId {StoreId}", storeId);
            return StatusCode(500, new { message = "Lỗi server khi tải danh sách voucher" });
        }
    }
}
