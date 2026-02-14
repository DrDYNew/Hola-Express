#nullable disable
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;

namespace HolaExpress_BE.Services.Owner;

public class OwnerService : IOwnerService
{
    private readonly IOwnerRepository _ownerRepository;
    private readonly ILogger<OwnerService> _logger;

    public OwnerService(IOwnerRepository ownerRepository, ILogger<OwnerService> logger)
    {
        _ownerRepository = ownerRepository;
        _logger = logger;
    }

    public async Task<OwnerDashboardDto?> GetDashboardDataAsync(int ownerId, int? storeId = null)
    {
        try
        {
            var store = await _ownerRepository.GetStoreByOwnerIdAsync(ownerId, storeId);
            if (store == null)
            {
                _logger.LogWarning($"Store not found for owner {ownerId}");
                return null;
            }

            var stats = await GetDashboardStatsAsync(ownerId, store.StoreId);
            var recentOrders = await GetRecentOrdersAsync(ownerId, store.StoreId, 10);
            var topProducts = await GetTopSellingProductsAsync(ownerId, store.StoreId, 5);

            return new OwnerDashboardDto
            {
                Stats = stats,
                RecentOrders = recentOrders,
                TopProducts = topProducts
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting dashboard data for owner {ownerId}");
            throw;
        }
    }

    public async Task<DashboardStatsDto?> GetDashboardStatsAsync(int ownerId, int? storeId = null)
    {
        try
        {
            var store = await _ownerRepository.GetStoreByOwnerIdAsync(ownerId, storeId);
            if (store == null)
            {
                return null;
            }

            var sid = store.StoreId;

            var todayRevenue = await _ownerRepository.GetTodayRevenueAsync(sid);
            var yesterdayRevenue = await _ownerRepository.GetYesterdayRevenueAsync(sid);
            var todayOrders = await _ownerRepository.GetTodayOrdersCountAsync(sid);
            var yesterdayOrders = await _ownerRepository.GetYesterdayOrdersCountAsync(sid);
            var todayProductsSold = await _ownerRepository.GetTodayProductsSoldAsync(sid);
            var yesterdayProductsSold = await _ownerRepository.GetYesterdayProductsSoldAsync(sid);
            var avgRating = await _ownerRepository.GetAverageRatingAsync(sid);
            var lastWeekRating = await _ownerRepository.GetLastWeekAverageRatingAsync(sid);
            var todayCustomers = await _ownerRepository.GetTodayNewCustomersAsync(sid);
            var yesterdayCustomers = await _ownerRepository.GetYesterdayNewCustomersAsync(sid);
            var lowStockItems = await _ownerRepository.GetLowStockItemsCountAsync(sid);

            return new DashboardStatsDto
            {
                TodayRevenue = todayRevenue,
                TodayRevenueChange = CalculatePercentageChange(todayRevenue, yesterdayRevenue),
                NewOrdersCount = todayOrders,
                NewOrdersChange = todayOrders - yesterdayOrders,
                TotalProductsSold = todayProductsSold,
                ProductsSoldChange = CalculatePercentageChange(todayProductsSold, yesterdayProductsSold),
                AverageRating = avgRating,
                RatingChange = avgRating - lastWeekRating,
                NewCustomers = todayCustomers,
                NewCustomersChange = todayCustomers - yesterdayCustomers,
                LowStockItems = lowStockItems,
                LowStockChange = 0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting dashboard stats for owner {ownerId}");
            throw;
        }
    }

    public async Task<List<RecentOrderDto>> GetRecentOrdersAsync(int ownerId, int? storeId = null, int limit = 10)
    {
        try
        {
            var store = await _ownerRepository.GetStoreByOwnerIdAsync(ownerId, storeId);
            if (store == null)
            {
                return new List<RecentOrderDto>();
            }

            var orders = await _ownerRepository.GetRecentOrdersAsync(store.StoreId, limit);

            return orders.Select(o => new RecentOrderDto
            {
                OrderId = o.OrderCode ?? $"#{o.OrderId}",
                CustomerName = o.Customer?.FullName ?? "Khách hàng",
                ItemsCount = o.OrderDetails?.Count ?? 0,
                TotalAmount = o.TotalAmount,
                Status = o.Status ?? "UNKNOWN",
                StatusText = GetStatusText(o.Status),
                CreatedAt = o.CreatedAt ?? DateTime.Now,
                Icon = GetStatusIcon(o.Status),
                Color = GetStatusColor(o.Status)
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting recent orders for owner {ownerId}");
            throw;
        }
    }

    public async Task<List<TopSellingProductDto>> GetTopSellingProductsAsync(int ownerId, int? storeId = null, int limit = 5)
    {
        try
        {
            var store = await _ownerRepository.GetStoreByOwnerIdAsync(ownerId, storeId);
            if (store == null)
            {
                return new List<TopSellingProductDto>();
            }

            var products = await _ownerRepository.GetTopSellingProductsAsync(store.StoreId, 30, limit);

            return products.Select(p => new TopSellingProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ImageUrl = p.ImageUrl,
                TotalSold = p.TotalSold,
                Revenue = p.Revenue
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting top selling products for owner {ownerId}");
            throw;
        }
    }

    private decimal CalculatePercentageChange(decimal current, decimal previous)
    {
        if (previous == 0)
        {
            return current > 0 ? 100 : 0;
        }
        return Math.Round(((current - previous) / previous) * 100, 1);
    }

    private string GetStatusText(string status)
    {
        return status switch
        {
            "PENDING" => "Chờ xác nhận",
            "CONFIRMED" => "Đã xác nhận",
            "PREPARING" => "Đang chuẩn bị",
            "READY" => "Sẵn sàng",
            "DELIVERING" => "Đang giao",
            "DELIVERED" => "Đã giao",
            "COMPLETED" => "Hoàn thành",
            "CANCELLED" => "Đã hủy",
            _ => "Không xác định"
        };
    }

    private string GetStatusIcon(string status)
    {
        return status switch
        {
            "PENDING" => "clock-outline",
            "CONFIRMED" => "check-circle",
            "PREPARING" => "chef-hat",
            "READY" => "package-variant",
            "DELIVERING" => "moped",
            "DELIVERED" => "check-circle",
            "COMPLETED" => "check-circle",
            "CANCELLED" => "close-circle",
            _ => "help-circle"
        };
    }

    private string GetStatusColor(string status)
    {
        return status switch
        {
            "PENDING" => "#f59e0b",
            "CONFIRMED" => "#3b82f6",
            "PREPARING" => "#3b82f6",
            "READY" => "#06b6d4",
            "DELIVERING" => "#8b5cf6",
            "DELIVERED" => "#10b981",
            "COMPLETED" => "#10b981",
            "CANCELLED" => "#ef4444",
            _ => "#6b7280"
        };
    }

    public async Task<RevenueReportDto?> GetRevenueReportAsync(int ownerId, string period, int? storeId = null)
    {
        try
        {
            var store = await _ownerRepository.GetStoreByOwnerIdAsync(ownerId, storeId);
            if (store == null)
            {
                return null;
            }

            var (startDate, endDate) = GetDateRangeForPeriod(period);
            var days = GetDaysForPeriod(period);

            var summary = await _ownerRepository.GetRevenueSummaryAsync(store.StoreId, startDate, endDate);
            var dailyRevenue = await _ownerRepository.GetDailyRevenueAsync(store.StoreId, startDate, endDate);
            var topProducts = await _ownerRepository.GetTopSellingProductsAsync(store.StoreId, days, 5);

            var averageOrderValue = summary.TotalOrders > 0 
                ? summary.TotalRevenue / summary.TotalOrders 
                : 0;

            return new RevenueReportDto
            {
                TotalRevenue = summary.TotalRevenue,
                TotalOrders = summary.TotalOrders,
                AverageOrderValue = averageOrderValue,
                TopSellingProducts = topProducts.Select(p => new TopSellingProductDto
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ImageUrl = p.ImageUrl,
                    TotalSold = p.TotalSold,
                    Revenue = p.Revenue
                }).ToList(),
                RevenueByDay = dailyRevenue.Select(d => new DailyRevenueDto
                {
                    Date = FormatDateLabel(d.Date, period),
                    Revenue = d.Revenue,
                    Orders = d.Orders
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting revenue report for owner {ownerId}");
            throw;
        }
    }

    private (DateTime startDate, DateTime endDate) GetDateRangeForPeriod(string period)
    {
        var now = DateTime.Now;
        var endDate = now.Date.AddDays(1).AddSeconds(-1); // End of today

        return period.ToLower() switch
        {
            "today" => (now.Date, endDate),
            "week" => (now.Date.AddDays(-6), endDate), // Last 7 days
            "month" => (now.Date.AddDays(-29), endDate), // Last 30 days
            "year" => (now.Date.AddDays(-364), endDate), // Last 365 days
            _ => (now.Date, endDate)
        };
    }

    private int GetDaysForPeriod(string period)
    {
        return period.ToLower() switch
        {
            "today" => 1,
            "week" => 7,
            "month" => 30,
            "year" => 365,
            _ => 1
        };
    }

    private string FormatDateLabel(DateTime date, string period)
    {
        var culture = new System.Globalization.CultureInfo("vi-VN");
        
        return period.ToLower() switch
        {
            "today" => date.ToString("HH:mm"),
            "week" => GetVietnameseDayShort(date.DayOfWeek),
            "month" => date.ToString("dd/MM"),
            "year" => date.ToString("MM/yy"),
            _ => date.ToString("dd/MM")
        };
    }

    private string GetVietnameseDayShort(DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Monday => "T2",
            DayOfWeek.Tuesday => "T3",
            DayOfWeek.Wednesday => "T4",
            DayOfWeek.Thursday => "T5",
            DayOfWeek.Friday => "T6",
            DayOfWeek.Saturday => "T7",
            DayOfWeek.Sunday => "CN",
            _ => "??"
        };
    }
}
