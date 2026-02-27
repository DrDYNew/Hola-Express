using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces.Admin;

public interface IAdminVoucherRepository
{
    Task<AdminVoucherListResultDto> GetVouchersAsync(AdminVoucherFilterDto filter);
    Task<AdminVoucherDetailDto?> GetVoucherByIdAsync(int voucherId);
    Task<Voucher> CreateVoucherAsync(CreateAdminVoucherDto dto);
    Task<bool> UpdateVoucherAsync(int voucherId, UpdateAdminVoucherDto dto);
    Task<bool> ToggleVoucherStatusAsync(int voucherId);
    Task<bool> DeleteVoucherAsync(int voucherId);
    Task<bool> IsCodeUniqueAsync(string code, int? excludeVoucherId = null);
}
