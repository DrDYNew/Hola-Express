using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces.Admin;

public interface IAdminVoucherService
{
    Task<AdminVoucherListResultDto> GetVouchersAsync(AdminVoucherFilterDto filter);
    Task<AdminVoucherDetailDto?> GetVoucherByIdAsync(int voucherId);
    Task<(bool Success, string? Error, AdminVoucherDetailDto? Voucher)> CreateVoucherAsync(CreateAdminVoucherDto dto);
    Task<(bool Success, string? Error)> UpdateVoucherAsync(int voucherId, UpdateAdminVoucherDto dto);
    Task<(bool Success, string? Error)> ToggleVoucherStatusAsync(int voucherId);
    Task<(bool Success, string? Error)> DeleteVoucherAsync(int voucherId);
}
