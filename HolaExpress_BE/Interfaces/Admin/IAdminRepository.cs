using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces.Admin
{
    public interface IAdminRepository
    {
        // Dashboard Statistics
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
        Task<List<UserSummaryDto>> GetRecentUsersAsync(int count = 5);
        Task<List<StoreSummaryDto>> GetRecentStoresAsync(int count = 5);
        Task<List<OrderSummaryDto>> GetRecentOrdersAsync(int count = 10);
        Task<List<RevenueDataDto>> GetRevenueChartDataAsync(int days = 7);

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

        // Statistics
        Task<int> GetTotalUsersCountAsync();
        Task<int> GetTotalStoresCountAsync();
        Task<int> GetTotalOrdersCountAsync();
        Task<decimal> GetTotalRevenueAsync();
        Task<int> GetActiveShippersCountAsync();
        Task<int> GetPendingOrdersCountAsync();
    }
}
