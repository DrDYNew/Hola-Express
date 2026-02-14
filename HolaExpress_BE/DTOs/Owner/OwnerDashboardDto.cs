namespace HolaExpress_BE.DTOs.Owner;

public class OwnerDashboardDto
{
    public DashboardStatsDto Stats { get; set; } = new();
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
    public List<TopSellingProductDto> TopProducts { get; set; } = new();
}

public class DashboardStatsDto
{
    public decimal TodayRevenue { get; set; }
    public decimal TodayRevenueChange { get; set; }
    public int NewOrdersCount { get; set; }
    public int NewOrdersChange { get; set; }
    public int TotalProductsSold { get; set; }
    public decimal ProductsSoldChange { get; set; }
    public decimal AverageRating { get; set; }
    public decimal RatingChange { get; set; }
    public int NewCustomers { get; set; }
    public int NewCustomersChange { get; set; }
    public int LowStockItems { get; set; }
    public int LowStockChange { get; set; }
}

public class RecentOrderDto
{
    public string OrderId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class TopSellingProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int TotalSold { get; set; }
    public decimal Revenue { get; set; }
}

public class RevenueReportDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<TopSellingProductDto> TopSellingProducts { get; set; } = new();
    public List<DailyRevenueDto> RevenueByDay { get; set; } = new();
}

public class DailyRevenueDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}
