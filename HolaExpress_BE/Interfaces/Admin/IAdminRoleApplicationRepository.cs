using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces.Admin
{
    public interface IAdminRoleApplicationRepository
    {
        /// <summary>
        /// Lấy danh sách đơn đăng ký với filter + phân trang
        /// </summary>
        Task<(List<RoleApplication> Items, int Total)> GetApplicationsAsync(AdminRoleApplicationFilterDto filter);

        /// <summary>
        /// Lấy chi tiết một đơn đăng ký
        /// </summary>
        Task<RoleApplication?> GetApplicationDetailAsync(int applicationId);

        /// <summary>
        /// Cập nhật trạng thái đơn (approve/reject)
        /// </summary>
        Task<bool> UpdateApplicationStatusAsync(int applicationId, string status, int adminId,
            string? adminNotes, string? rejectionReason);

        /// <summary>
        /// Thống kê số đơn theo trạng thái
        /// </summary>
        Task<Dictionary<string, int>> GetApplicationCountByStatusAsync();
    }
}
