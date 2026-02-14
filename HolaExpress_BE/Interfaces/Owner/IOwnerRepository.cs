using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces.Owner;

public interface IOwnerRepository
{
    Task<Store?> GetStoreByOwnerIdAsync(int ownerId, int? storeId = null);
    Task<decimal> GetTodayRevenueAsync(int storeId);
    Task<decimal> GetYesterdayRevenueAsync(int storeId);
    Task<int> GetTodayOrdersCountAsync(int storeId);
    Task<int> GetYesterdayOrdersCountAsync(int storeId);
    Task<int> GetTodayProductsSoldAsync(int storeId);
    Task<int> GetYesterdayProductsSoldAsync(int storeId);
    Task<decimal> GetAverageRatingAsync(int storeId);
    Task<decimal> GetLastWeekAverageRatingAsync(int storeId);
    Task<int> GetTodayNewCustomersAsync(int storeId);
    Task<int> GetYesterdayNewCustomersAsync(int storeId);
    Task<int> GetLowStockItemsCountAsync(int storeId);
    Task<List<Order>> GetRecentOrdersAsync(int storeId, int limit);
    Task<List<(int ProductId, string ProductName, string? ImageUrl, int TotalSold, decimal Revenue)>> GetTopSellingProductsAsync(int storeId, int days, int limit);
    Task<(decimal TotalRevenue, int TotalOrders)> GetRevenueSummaryAsync(int storeId, DateTime startDate, DateTime endDate);
    Task<List<(DateTime Date, decimal Revenue, int Orders)>> GetDailyRevenueAsync(int storeId, DateTime startDate, DateTime endDate);
}
