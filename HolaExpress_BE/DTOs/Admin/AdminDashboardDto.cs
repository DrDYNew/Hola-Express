namespace HolaExpress_BE.DTOs.Admin
{
    public class AdminDashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int UsersChange { get; set; }
        public int TotalStores { get; set; }
        public int StoresChange { get; set; }
        public int TotalOrders { get; set; }
        public int OrdersChange { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueChange { get; set; }
        public int ActiveShippers { get; set; }
        public int ShippersChange { get; set; }
        public int PendingOrders { get; set; }
        public int PendingChange { get; set; }
        public decimal TodayRevenue { get; set; }
        public int TodayOrders { get; set; }
        public int TotalProducts { get; set; }
        public int ProductsChange { get; set; }
    }

    public class UserSummaryDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class StoreSummaryDto
    {
        public int StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal Revenue { get; set; }
        public double Rating { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OrderSummaryDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string StoreName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int? ShipperId { get; set; }
        public string? ShipperName { get; set; }
    }

    public class RevenueDataDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }

    public class AdminDashboardDto
    {
        public AdminDashboardStatsDto Stats { get; set; } = new();
        public List<UserSummaryDto> RecentUsers { get; set; } = new();
        public List<StoreSummaryDto> RecentStores { get; set; } = new();
        public List<OrderSummaryDto> RecentOrders { get; set; } = new();
        public List<RevenueDataDto> RevenueChart { get; set; } = new();
    }

    public class UsersListDto
    {
        public List<UserSummaryDto> Users { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }

    public class StoresListDto
    {
        public List<StoreSummaryDto> Stores { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }

    public class OrdersListDto
    {
        public List<OrderSummaryDto> Orders { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class UpdateStoreStatusDto
    {
        public bool IsActive { get; set; }
    }
}
