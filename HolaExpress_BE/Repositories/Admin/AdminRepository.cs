using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.Models;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Repositories.Admin
{
    public class AdminRepository : IAdminRepository
    {
        private readonly HolaExpressContext _context;

        public AdminRepository(HolaExpressContext context)
        {
            _context = context;
        }

        #region Dashboard Statistics

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var yesterday = today.AddDays(-1);
            var lastWeek = today.AddDays(-7);

            // Thống kê tổng quan
            var totalUsers = await _context.Users.CountAsync();
            var usersLastWeek = await _context.Users.CountAsync(u => u.CreatedAt >= lastWeek);
            var usersYesterday = await _context.Users.CountAsync(u => u.CreatedAt >= yesterday && u.CreatedAt < today);

            var totalStores = await _context.Stores.CountAsync();
            var storesLastWeek = await _context.Stores.CountAsync(s => s.CreatedAt >= lastWeek);
            var storesYesterday = await _context.Stores.CountAsync(s => s.CreatedAt >= yesterday && s.CreatedAt < today);

            var totalOrders = await _context.Orders.CountAsync();
            var ordersLastWeek = await _context.Orders.CountAsync(o => o.CreatedAt >= lastWeek);
            var ordersYesterday = await _context.Orders.CountAsync(o => o.CreatedAt >= yesterday && o.CreatedAt < today);

            var totalRevenue = await _context.Orders
                .Where(o => o.Status == "COMPLETED" || o.Status == "DELIVERED")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var revenueLastWeek = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED") && o.CreatedAt >= lastWeek)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var revenueYesterday = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED")
                    && o.CreatedAt >= yesterday && o.CreatedAt < today)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var todayRevenue = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED") && o.CreatedAt >= today)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var todayOrders = await _context.Orders.CountAsync(o => o.CreatedAt >= today);

            var activeShippers = await _context.Users.CountAsync(u => u.Role == "SHIPPER" && u.Status == "ACTIVE");
            var shippersLastWeek = await _context.Users.CountAsync(u => u.Role == "SHIPPER" && u.CreatedAt >= lastWeek);
            var shippersYesterday = await _context.Users.CountAsync(u => u.Role == "SHIPPER"
                && u.CreatedAt >= yesterday && u.CreatedAt < today);

            var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "PENDING");
            var pendingYesterday = await _context.Orders.CountAsync(o => o.Status == "PENDING"
                && o.CreatedAt >= yesterday && o.CreatedAt < today);

            var totalProducts = await _context.Products.CountAsync();
            var productsLastWeek = 0; // Products don't have CreatedAt
            var productsYesterday = 0;

            return new AdminDashboardStatsDto
            {
                TotalUsers = totalUsers,
                UsersChange = usersLastWeek - usersYesterday,
                TotalStores = totalStores,
                StoresChange = storesLastWeek - storesYesterday,
                TotalOrders = totalOrders,
                OrdersChange = ordersLastWeek - ordersYesterday,
                TotalRevenue = totalRevenue,
                RevenueChange = revenueYesterday > 0 ? ((revenueLastWeek - revenueYesterday) / revenueYesterday * 100) : 0,
                ActiveShippers = activeShippers,
                ShippersChange = shippersLastWeek - shippersYesterday,
                PendingOrders = pendingOrders,
                PendingChange = pendingOrders - pendingYesterday,
                TodayRevenue = todayRevenue,
                TodayOrders = todayOrders,
                TotalProducts = totalProducts,
                ProductsChange = productsLastWeek - productsYesterday
            };
        }

        public async Task<List<UserSummaryDto>> GetRecentUsersAsync(int count = 5)
        {
            return await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(count)
                .Select(u => new UserSummaryDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email ?? "",
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role ?? "USER",
                    IsActive = u.Status == "ACTIVE",
                    CreatedAt = u.CreatedAt ?? DateTime.UtcNow,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();
        }

        public async Task<List<StoreSummaryDto>> GetRecentStoresAsync(int count = 5)
        {
            return await _context.Stores
                .Include(s => s.Owner)
                .OrderByDescending(s => s.CreatedAt)
                .Take(count)
                .Select(s => new StoreSummaryDto
                {
                    StoreId = s.StoreId,
                    StoreName = s.StoreName,
                    OwnerName = s.Owner.FullName,
                    Status = s.IsActive == true ? "ACTIVE" : "INACTIVE",
                    TotalOrders = s.Orders.Count,
                    Revenue = s.Orders.Where(o => o.Status == "COMPLETED" || o.Status == "DELIVERED")
                        .Sum(o => (decimal?)o.TotalAmount) ?? 0,
                    Rating = (double)(s.Rating ?? 0),
                    CreatedAt = s.CreatedAt ?? DateTime.UtcNow
                })
                .ToListAsync();
        }

        public async Task<List<OrderSummaryDto>> GetRecentOrdersAsync(int count = 10)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Store)
                .Include(o => o.Shipper)
                .OrderByDescending(o => o.CreatedAt)
                .Take(count)
                .Select(o => new OrderSummaryDto
                {
                    OrderId = o.OrderId,
                    OrderCode = o.OrderCode,
                    CustomerName = o.Customer.FullName,
                    StoreName = o.Store.StoreName,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status ?? "PENDING",
                    CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                    ShipperId = o.ShipperId,
                    ShipperName = o.Shipper != null ? o.Shipper.FullName : null
                })
                .ToListAsync();
        }

        public async Task<List<RevenueDataDto>> GetRevenueChartDataAsync(int days = 7)
        {
            var today = DateTime.UtcNow.Date;
            var revenueChart = new List<RevenueDataDto>();

            for (int i = days - 1; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var nextDate = date.AddDays(1);

                var dayRevenue = await _context.Orders
                    .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED")
                        && o.CreatedAt >= date && o.CreatedAt < nextDate)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                var dayOrders = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= date && o.CreatedAt < nextDate);

                revenueChart.Add(new RevenueDataDto
                {
                    Date = date.ToString("dd/MM"),
                    Revenue = dayRevenue,
                    Orders = dayOrders
                });
            }

            return revenueChart;
        }

        #endregion

        #region User Management

        public async Task<(List<UserSummaryDto> Users, int Total)> GetUsersAsync(int page, int limit, string? role = null)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                // Nếu filter theo USER hoặc CUSTOMER thì lấy cả 2 (vì cả 2 đều là khách hàng)
                if (role.ToUpper() == "USER" || role.ToUpper() == "CUSTOMER")
                {
                    query = query.Where(u => u.Role == "USER" || u.Role == "CUSTOMER");
                }
                else
                {
                    query = query.Where(u => u.Role == role);
                }
            }

            var total = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(u => new UserSummaryDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email ?? "",
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role ?? "USER",
                    IsActive = u.Status == "ACTIVE",
                    CreatedAt = u.CreatedAt ?? DateTime.UtcNow,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            return (users, total);
        }

        public async Task<UserSummaryDto?> GetUserByIdAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new UserSummaryDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email ?? "",
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role ?? "USER",
                    IsActive = u.Status == "ACTIVE",
                    CreatedAt = u.CreatedAt ?? DateTime.UtcNow,
                    AvatarUrl = u.AvatarUrl
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateUserStatusAsync(int userId, bool isActive)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Status = isActive ? "ACTIVE" : "INACTIVE";
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Store Management

        public async Task<(List<StoreSummaryDto> Stores, int Total)> GetStoresAsync(int page, int limit)
        {
            var total = await _context.Stores.CountAsync();

            var stores = await _context.Stores
                .Include(s => s.Owner)
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(s => new StoreSummaryDto
                {
                    StoreId = s.StoreId,
                    StoreName = s.StoreName,
                    OwnerName = s.Owner.FullName,
                    Status = s.IsActive == true ? "ACTIVE" : "INACTIVE",
                    TotalOrders = s.Orders.Count,
                    Revenue = s.Orders.Where(o => o.Status == "COMPLETED" || o.Status == "DELIVERED")
                        .Sum(o => (decimal?)o.TotalAmount) ?? 0,
                    Rating = (double)(s.Rating ?? 0),
                    CreatedAt = s.CreatedAt ?? DateTime.UtcNow
                })
                .ToListAsync();

            return (stores, total);
        }

        public async Task<StoreSummaryDto?> GetStoreByIdAsync(int storeId)
        {
            return await _context.Stores
                .Include(s => s.Owner)
                .Where(s => s.StoreId == storeId)
                .Select(s => new StoreSummaryDto
                {
                    StoreId = s.StoreId,
                    StoreName = s.StoreName,
                    OwnerName = s.Owner.FullName,
                    Status = s.IsActive == true ? "ACTIVE" : "INACTIVE",
                    TotalOrders = s.Orders.Count,
                    Revenue = s.Orders.Where(o => o.Status == "COMPLETED" || o.Status == "DELIVERED")
                        .Sum(o => (decimal?)o.TotalAmount) ?? 0,
                    Rating = (double)(s.Rating ?? 0),
                    CreatedAt = s.CreatedAt ?? DateTime.UtcNow
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateStoreStatusAsync(int storeId, string status)
        {
            var store = await _context.Stores.FindAsync(storeId);
            if (store == null)
                return false;

            store.IsActive = status.ToUpper() == "ACTIVE";
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Order Management

        public async Task<(List<OrderSummaryDto> Orders, int Total)> GetOrdersAsync(int page, int limit, string? status = null)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Store)
                .Include(o => o.Shipper)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var total = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(o => new OrderSummaryDto
                {
                    OrderId = o.OrderId,
                    OrderCode = o.OrderCode,
                    CustomerName = o.Customer.FullName,
                    StoreName = o.Store.StoreName,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status ?? "PENDING",
                    CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                    ShipperId = o.ShipperId,
                    ShipperName = o.Shipper != null ? o.Shipper.FullName : null
                })
                .ToListAsync();

            return (orders, total);
        }

        public async Task<OrderSummaryDto?> GetOrderByIdAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Store)
                .Include(o => o.Shipper)
                .Where(o => o.OrderId == orderId)
                .Select(o => new OrderSummaryDto
                {
                    OrderId = o.OrderId,
                    OrderCode = o.OrderCode,
                    CustomerName = o.Customer.FullName,
                    StoreName = o.Store.StoreName,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status ?? "PENDING",
                    CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                    ShipperId = o.ShipperId,
                    ShipperName = o.Shipper != null ? o.Shipper.FullName : null
                })
                .FirstOrDefaultAsync();
        }

        #endregion

        #region Statistics Methods

        public async Task<int> GetTotalUsersCountAsync()
        {
            return await _context.Users.CountAsync();
        }

        public async Task<int> GetTotalStoresCountAsync()
        {
            return await _context.Stores.CountAsync();
        }

        public async Task<int> GetTotalOrdersCountAsync()
        {
            return await _context.Orders.CountAsync();
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            return await _context.Orders
                .Where(o => o.Status == "COMPLETED" || o.Status == "DELIVERED")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        }

        public async Task<int> GetActiveShippersCountAsync()
        {
            return await _context.Users.CountAsync(u => u.Role == "SHIPPER" && u.Status == "ACTIVE");
        }

        public async Task<int> GetPendingOrdersCountAsync()
        {
            return await _context.Orders.CountAsync(o => o.Status == "PENDING");
        }

        #endregion
    }
}
