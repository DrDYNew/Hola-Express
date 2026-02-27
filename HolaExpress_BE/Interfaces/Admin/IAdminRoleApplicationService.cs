using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces.Admin
{
    public interface IAdminRoleApplicationService
    {
        /// <summary>
        /// Danh sách đơn đăng ký với search + filter + phân trang
        /// </summary>
        Task<AdminRoleApplicationListDto> GetApplicationsAsync(AdminRoleApplicationFilterDto filter);

        /// <summary>
        /// Chi tiết một đơn đăng ký
        /// </summary>
        Task<AdminRoleApplicationDetailDto> GetApplicationDetailAsync(int applicationId);

        /// <summary>
        /// Duyệt hoặc từ chối đơn
        /// </summary>
        Task<AdminRoleApplicationDetailDto> ProcessApplicationAsync(int applicationId, int adminId, AdminProcessApplicationDto dto);

        /// <summary>
        /// Thống kê số đơn theo trạng thái
        /// </summary>
        Task<Dictionary<string, int>> GetApplicationCountByStatusAsync();
    }
}
