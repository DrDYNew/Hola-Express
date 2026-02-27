using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Services.Admin
{
    public class AdminRoleApplicationService : IAdminRoleApplicationService
    {
        private readonly IAdminRoleApplicationRepository _repo;
        private readonly ILogger<AdminRoleApplicationService> _logger;

        public AdminRoleApplicationService(
            IAdminRoleApplicationRepository repo,
            ILogger<AdminRoleApplicationService> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<AdminRoleApplicationListDto> GetApplicationsAsync(AdminRoleApplicationFilterDto filter)
        {
            var (items, total) = await _repo.GetApplicationsAsync(filter);

            return new AdminRoleApplicationListDto
            {
                Items = items.Select(MapToListItem).ToList(),
                Total = total,
                Page = filter.Page,
                Limit = filter.Limit,
                TotalPages = (int)Math.Ceiling(total / (double)filter.Limit)
            };
        }

        public async Task<AdminRoleApplicationDetailDto> GetApplicationDetailAsync(int applicationId)
        {
            var application = await _repo.GetApplicationDetailAsync(applicationId);
            if (application == null)
                throw new InvalidOperationException("Không tìm thấy đơn đăng ký");

            return MapToDetail(application);
        }

        public async Task<AdminRoleApplicationDetailDto> ProcessApplicationAsync(
            int applicationId, int adminId, AdminProcessApplicationDto dto)
        {
            // Validate
            var upperStatus = dto.Status?.ToUpper();
            if (upperStatus != "APPROVED" && upperStatus != "REJECTED")
                throw new ArgumentException("Trạng thái phải là APPROVED hoặc REJECTED");

            if (upperStatus == "REJECTED" && string.IsNullOrWhiteSpace(dto.RejectionReason))
                throw new ArgumentException("Vui lòng cung cấp lý do từ chối");

            // Kiểm tra đơn tồn tại và còn PENDING
            var existing = await _repo.GetApplicationDetailAsync(applicationId);
            if (existing == null)
                throw new InvalidOperationException("Không tìm thấy đơn đăng ký");

            if (existing.Status != "PENDING")
                throw new InvalidOperationException($"Đơn đã được xử lý (trạng thái hiện tại: {existing.Status})");

            var success = await _repo.UpdateApplicationStatusAsync(
                applicationId, upperStatus, adminId, dto.AdminNotes, dto.RejectionReason);

            if (!success)
                throw new InvalidOperationException("Không thể cập nhật đơn đăng ký");

            _logger.LogInformation("Admin {AdminId} {Status} application {ApplicationId}",
                adminId, upperStatus, applicationId);

            // Trả về detail mới nhất
            var updated = await _repo.GetApplicationDetailAsync(applicationId);
            return MapToDetail(updated!);
        }

        public async Task<Dictionary<string, int>> GetApplicationCountByStatusAsync()
        {
            return await _repo.GetApplicationCountByStatusAsync();
        }

        // ─── Mapping helpers ───────────────────────────────────────────────────

        private static AdminRoleApplicationListItemDto MapToListItem(RoleApplication ra) => new()
        {
            ApplicationId = ra.ApplicationId,
            UserId = ra.UserId,
            UserName = ra.User.FullName,
            UserPhone = ra.User.PhoneNumber,
            UserEmail = ra.User.Email,
            UserAvatarUrl = ra.User.AvatarUrl,
            RequestedRole = ra.RequestedRole,
            Status = ra.Status,
            ApplicationDate = ra.ApplicationDate,
            ProcessedDate = ra.ProcessedDate,
            ProcessedByName = ra.ProcessedByUser?.FullName
        };

        private static AdminRoleApplicationDetailDto MapToDetail(RoleApplication ra) => new()
        {
            ApplicationId = ra.ApplicationId,
            UserId = ra.UserId,
            UserName = ra.User.FullName,
            UserPhone = ra.User.PhoneNumber,
            UserEmail = ra.User.Email,
            UserAvatarUrl = ra.User.AvatarUrl,
            RequestedRole = ra.RequestedRole,
            Status = ra.Status,

            // Shipper
            LicenseNumber = ra.LicenseNumber,
            VehiclePlate = ra.VehiclePlate,
            VehicleType = ra.VehicleType,
            VehicleTypeOther = ra.VehicleTypeOther,

            // Owner
            BusinessName = ra.BusinessName,
            BusinessAddress = ra.BusinessAddress,
            BusinessLicense = ra.BusinessLicense,
            TaxCode = ra.TaxCode,

            // Common
            Notes = ra.Notes,
            AdminNotes = ra.AdminNotes,
            RejectionReason = ra.RejectionReason,

            // Document URLs
            IdCardFrontUrl = ra.IdCardFrontMedia?.FilePath,
            IdCardBackUrl = ra.IdCardBackMedia?.FilePath,
            LicenseFrontUrl = ra.LicenseFrontMedia?.FilePath,
            LicenseBackUrl = ra.LicenseBackMedia?.FilePath,
            BusinessLicenseDocumentUrl = ra.BusinessLicenseMedia?.FilePath,
            TaxCodeDocumentUrl = ra.TaxCodeMedia?.FilePath,

            ApplicationDate = ra.ApplicationDate,
            ProcessedDate = ra.ProcessedDate,
            ProcessedBy = ra.ProcessedBy,
            ProcessedByName = ra.ProcessedByUser?.FullName,
            CreatedAt = ra.CreatedAt
        };
    }
}
