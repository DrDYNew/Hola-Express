using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces.Admin
{
    public interface IAdminService
    {
        // Dashboard
        Task<AdminDashboardDto> GetDashboardAsync();
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync();

        // User Management
        Task<(List<UserSummaryDto> Users, int Total)> GetUsersAsync(int page, int limit, string? role = null);
        Task<UserSummaryDto?> GetUserByIdAsync(int userId);
        Task<bool> UpdateUserStatusAsync(int userId, bool isActive);

        // Store Management
        Task<(List<StoreSummaryDto> Stores, int Total)> GetStoresAsync(int page, int limit);
        Task<StoreSummaryDto?> GetStoreByIdAsync(int storeId);
        Task<bool> UpdateStoreStatusAsync(int storeId, string status);

        // Order Management
        Task<(List<OrderSummaryDto> Orders, int Total)> GetOrdersAsync(int page, int limit, string? status = null);
        Task<OrderSummaryDto?> GetOrderByIdAsync(int orderId);
    }
}
