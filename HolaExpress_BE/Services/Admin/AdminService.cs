using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Services.Admin
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepository;
        private readonly ILogger<AdminService> _logger;

        public AdminService(IAdminRepository adminRepository, ILogger<AdminService> logger)
        {
            _adminRepository = adminRepository;
            _logger = logger;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            try
            {
                var stats = await _adminRepository.GetDashboardStatsAsync();
                var recentUsers = await _adminRepository.GetRecentUsersAsync(5);
                var recentStores = await _adminRepository.GetRecentStoresAsync(5);
                var recentOrders = await _adminRepository.GetRecentOrdersAsync(10);
                var revenueChart = await _adminRepository.GetRevenueChartDataAsync(7);

                return new AdminDashboardDto
                {
                    Stats = stats,
                    RecentUsers = recentUsers,
                    RecentStores = recentStores,
                    RecentOrders = recentOrders,
                    RevenueChart = revenueChart
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin dashboard");
                throw;
            }
        }

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
        {
            try
            {
                return await _adminRepository.GetDashboardStatsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                throw;
            }
        }

        public async Task<(List<UserSummaryDto> Users, int Total)> GetUsersAsync(int page, int limit, string? role = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (limit < 1) limit = 10;
                if (limit > 100) limit = 100; // Max limit

                return await _adminRepository.GetUsersAsync(page, limit, role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users list");
                throw;
            }
        }

        public async Task<UserSummaryDto?> GetUserByIdAsync(int userId)
        {
            try
            {
                return await _adminRepository.GetUserByIdAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by id: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> UpdateUserStatusAsync(int userId, bool isActive)
        {
            try
            {
                if (userId <= 0)
                {
                    throw new ArgumentException("Invalid user ID");
                }

                return await _adminRepository.UpdateUserStatusAsync(userId, isActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status for userId: {UserId}", userId);
                throw;
            }
        }

        public async Task<(List<StoreSummaryDto> Stores, int Total)> GetStoresAsync(int page, int limit)
        {
            try
            {
                if (page < 1) page = 1;
                if (limit < 1) limit = 10;
                if (limit > 100) limit = 100;

                return await _adminRepository.GetStoresAsync(page, limit);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stores list");
                throw;
            }
        }

        public async Task<StoreSummaryDto?> GetStoreByIdAsync(int storeId)
        {
            try
            {
                return await _adminRepository.GetStoreByIdAsync(storeId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting store by id: {StoreId}", storeId);
                throw;
            }
        }

        public async Task<bool> UpdateStoreStatusAsync(int storeId, string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    throw new ArgumentException("Status cannot be empty");
                }

                var validStatuses = new[] { "ACTIVE", "INACTIVE", "SUSPENDED", "CLOSED" };
                if (!validStatuses.Contains(status.ToUpper()))
                {
                    throw new ArgumentException("Invalid status value");
                }

                return await _adminRepository.UpdateStoreStatusAsync(storeId, status.ToUpper());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating store status for storeId: {StoreId}", storeId);
                throw;
            }
        }

        public async Task<(List<OrderSummaryDto> Orders, int Total)> GetOrdersAsync(int page, int limit, string? status = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (limit < 1) limit = 10;
                if (limit > 100) limit = 100;

                return await _adminRepository.GetOrdersAsync(page, limit, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders list");
                throw;
            }
        }

        public async Task<OrderSummaryDto?> GetOrderByIdAsync(int orderId)
        {
            try
            {
                return await _adminRepository.GetOrderByIdAsync(orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by id: {OrderId}", orderId);
                throw;
            }
        }
    }
}
