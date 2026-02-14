using HolaExpress_BE.DTOs.Owner;

namespace HolaExpress_BE.Interfaces.Owner;

public interface IOwnerService
{
    Task<OwnerDashboardDto?> GetDashboardDataAsync(int ownerId, int? storeId = null);
    Task<DashboardStatsDto?> GetDashboardStatsAsync(int ownerId, int? storeId = null);
    Task<List<RecentOrderDto>> GetRecentOrdersAsync(int ownerId, int? storeId = null, int limit = 10);
    Task<List<TopSellingProductDto>> GetTopSellingProductsAsync(int ownerId, int? storeId = null, int limit = 5);
    Task<RevenueReportDto?> GetRevenueReportAsync(int ownerId, string period, int? storeId = null);
}
