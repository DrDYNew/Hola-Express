#nullable disable
using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Repositories.Admin;

public class AdminVoucherRepository : IAdminVoucherRepository
{
    private readonly HolaExpressContext _context;

    public AdminVoucherRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<AdminVoucherListResultDto> GetVouchersAsync(AdminVoucherFilterDto filter)
    {
        var query = _context.Vouchers
            .Where(v => v.StoreId == null) // System vouchers only
            .AsQueryable();

        // Search by code
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(v => v.Code.ToLower().Contains(search));
        }

        // Filter by discount type
        if (!string.IsNullOrWhiteSpace(filter.DiscountType))
        {
            query = query.Where(v => v.DiscountType == filter.DiscountType);
        }

        // Filter by active status
        if (filter.IsActive.HasValue)
        {
            query = query.Where(v => (v.IsActive ?? true) == filter.IsActive.Value);
        }

        // Filter by start date range
        if (filter.StartDateFrom.HasValue)
            query = query.Where(v => v.StartDate >= filter.StartDateFrom.Value);
        if (filter.StartDateTo.HasValue)
            query = query.Where(v => v.StartDate <= filter.StartDateTo.Value);

        // Filter by end date range
        if (filter.EndDateFrom.HasValue)
            query = query.Where(v => v.EndDate >= filter.EndDateFrom.Value);
        if (filter.EndDateTo.HasValue)
            query = query.Where(v => v.EndDate <= filter.EndDateTo.Value);

        var totalCount = await query.CountAsync();

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 10 : filter.PageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var items = await query
            .OrderByDescending(v => v.VoucherId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new AdminVoucherListItemDto
            {
                VoucherId = v.VoucherId,
                Code = v.Code,
                DiscountType = v.DiscountType ?? "PERCENTAGE",
                DiscountValue = v.DiscountValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                MinOrderValue = v.MinOrderValue,
                UsageLimit = v.UsageLimit,
                UsedCount = v.Orders.Count,
                StartDate = v.StartDate,
                EndDate = v.EndDate,
                IsActive = v.IsActive ?? true
            })
            .ToListAsync();

        return new AdminVoucherListResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<AdminVoucherDetailDto?> GetVoucherByIdAsync(int voucherId)
    {
        var v = await _context.Vouchers
            .Where(v => v.VoucherId == voucherId && v.StoreId == null)
            .Select(v => new AdminVoucherDetailDto
            {
                VoucherId = v.VoucherId,
                Code = v.Code,
                DiscountType = v.DiscountType ?? "PERCENTAGE",
                DiscountValue = v.DiscountValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                MinOrderValue = v.MinOrderValue,
                UsageLimit = v.UsageLimit,
                UsedCount = v.Orders.Count,
                StartDate = v.StartDate,
                EndDate = v.EndDate,
                IsActive = v.IsActive ?? true
            })
            .FirstOrDefaultAsync();

        return v;
    }

    public async Task<Voucher> CreateVoucherAsync(CreateAdminVoucherDto dto)
    {
        var voucher = new Voucher
        {
            Code = dto.Code.Trim().ToUpper(),
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            MinOrderValue = dto.MinOrderValue,
            UsageLimit = dto.UsageLimit,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            StoreId = null // System voucher
        };

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync();
        return voucher;
    }

    public async Task<bool> UpdateVoucherAsync(int voucherId, UpdateAdminVoucherDto dto)
    {
        var voucher = await _context.Vouchers
            .FirstOrDefaultAsync(v => v.VoucherId == voucherId && v.StoreId == null);

        if (voucher == null) return false;

        if (dto.Code != null) voucher.Code = dto.Code.Trim().ToUpper();
        if (dto.DiscountType != null) voucher.DiscountType = dto.DiscountType;
        if (dto.DiscountValue.HasValue) voucher.DiscountValue = dto.DiscountValue.Value;
        if (dto.MaxDiscountAmount.HasValue) voucher.MaxDiscountAmount = dto.MaxDiscountAmount;
        if (dto.MinOrderValue.HasValue) voucher.MinOrderValue = dto.MinOrderValue;
        if (dto.UsageLimit.HasValue) voucher.UsageLimit = dto.UsageLimit;
        if (dto.StartDate.HasValue) voucher.StartDate = dto.StartDate;
        if (dto.EndDate.HasValue) voucher.EndDate = dto.EndDate;
        if (dto.IsActive.HasValue) voucher.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleVoucherStatusAsync(int voucherId)
    {
        var voucher = await _context.Vouchers
            .FirstOrDefaultAsync(v => v.VoucherId == voucherId && v.StoreId == null);

        if (voucher == null) return false;

        voucher.IsActive = !(voucher.IsActive ?? true);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteVoucherAsync(int voucherId)
    {
        var voucher = await _context.Vouchers
            .FirstOrDefaultAsync(v => v.VoucherId == voucherId && v.StoreId == null);

        if (voucher == null) return false;

        _context.Vouchers.Remove(voucher);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsCodeUniqueAsync(string code, int? excludeVoucherId = null)
    {
        var normalizedCode = code.Trim().ToUpper();
        var query = _context.Vouchers.Where(v => v.Code == normalizedCode);
        if (excludeVoucherId.HasValue)
            query = query.Where(v => v.VoucherId != excludeVoucherId.Value);
        return !await query.AnyAsync();
    }
}
