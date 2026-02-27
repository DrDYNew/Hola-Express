using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Services.Admin;

public class AdminVoucherService : IAdminVoucherService
{
    private readonly IAdminVoucherRepository _repo;

    public AdminVoucherService(IAdminVoucherRepository repo)
    {
        _repo = repo;
    }

    public Task<AdminVoucherListResultDto> GetVouchersAsync(AdminVoucherFilterDto filter)
        => _repo.GetVouchersAsync(filter);

    public Task<AdminVoucherDetailDto?> GetVoucherByIdAsync(int voucherId)
        => _repo.GetVoucherByIdAsync(voucherId);

    public async Task<(bool Success, string? Error, AdminVoucherDetailDto? Voucher)> CreateVoucherAsync(CreateAdminVoucherDto dto)
    {
        // Validate code
        if (string.IsNullOrWhiteSpace(dto.Code))
            return (false, "Mã voucher không được để trống", null);

        if (dto.DiscountValue <= 0)
            return (false, "Giá trị giảm giá phải lớn hơn 0", null);

        if (dto.DiscountType == "PERCENTAGE" && dto.DiscountValue > 100)
            return (false, "Phần trăm giảm giá không được vượt quá 100", null);

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate >= dto.EndDate)
            return (false, "Ngày bắt đầu phải trước ngày kết thúc", null);

        var isUnique = await _repo.IsCodeUniqueAsync(dto.Code);
        if (!isUnique)
            return (false, "Mã voucher đã tồn tại", null);

        var created = await _repo.CreateVoucherAsync(dto);
        var detail = await _repo.GetVoucherByIdAsync(created.VoucherId);
        return (true, null, detail);
    }

    public async Task<(bool Success, string? Error)> UpdateVoucherAsync(int voucherId, UpdateAdminVoucherDto dto)
    {
        var existing = await _repo.GetVoucherByIdAsync(voucherId);
        if (existing == null)
            return (false, "Không tìm thấy voucher");

        if (dto.DiscountValue.HasValue && dto.DiscountValue.Value <= 0)
            return (false, "Giá trị giảm giá phải lớn hơn 0");

        if (dto.DiscountType == "PERCENTAGE" && dto.DiscountValue.HasValue && dto.DiscountValue.Value > 100)
            return (false, "Phần trăm giảm giá không được vượt quá 100");

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate >= dto.EndDate)
            return (false, "Ngày bắt đầu phải trước ngày kết thúc");

        // Check code uniqueness if being changed
        if (dto.Code != null)
        {
            var isUnique = await _repo.IsCodeUniqueAsync(dto.Code, voucherId);
            if (!isUnique)
                return (false, "Mã voucher đã tồn tại");
        }

        var success = await _repo.UpdateVoucherAsync(voucherId, dto);
        return success ? (true, null) : (false, "Cập nhật thất bại");
    }

    public async Task<(bool Success, string? Error)> ToggleVoucherStatusAsync(int voucherId)
    {
        var existing = await _repo.GetVoucherByIdAsync(voucherId);
        if (existing == null)
            return (false, "Không tìm thấy voucher");

        var success = await _repo.ToggleVoucherStatusAsync(voucherId);
        return success ? (true, null) : (false, "Thao tác thất bại");
    }

    public async Task<(bool Success, string? Error)> DeleteVoucherAsync(int voucherId)
    {
        var existing = await _repo.GetVoucherByIdAsync(voucherId);
        if (existing == null)
            return (false, "Không tìm thấy voucher");

        var success = await _repo.DeleteVoucherAsync(voucherId);
        return success ? (true, null) : (false, "Xóa thất bại");
    }
}
