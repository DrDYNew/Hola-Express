using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Controllers.Admin
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy dữ liệu dashboard admin
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var dashboard = await _adminService.GetDashboardAsync();

                return Ok(new
                {
                    success = true,
                    data = dashboard
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin dashboard");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải dữ liệu dashboard"
                });
            }
        }

        /// <summary>
        /// Lấy thống kê dashboard
        /// </summary>
        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _adminService.GetDashboardStatsAsync();

                return Ok(new
                {
                    success = true,
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard stats");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thống kê"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách người dùng
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10,
            [FromQuery] string? role = null)
        {
            try
            {
                var (users, total) = await _adminService.GetUsersAsync(page, limit, role);
                var totalPages = (int)Math.Ceiling(total / (double)limit);

                return Ok(new
                {
                    success = true,
                    data = new UsersListDto
                    {
                        Users = users,
                        Total = total,
                        Page = page,
                        Limit = limit,
                        TotalPages = totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách người dùng"
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết người dùng
        /// </summary>
        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            try
            {
                var user = await _adminService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy người dùng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = user
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user by id: {UserId}", userId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin người dùng"
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái người dùng
        /// </summary>
        [HttpPut("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(int userId, [FromBody] UpdateUserStatusDto request)
        {
            try
            {
                var result = await _adminService.UpdateUserStatusAsync(userId, request.IsActive);
                
                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy người dùng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật trạng thái thành công"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách cửa hàng
        /// </summary>
        [HttpGet("stores")]
        public async Task<IActionResult> GetStores([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var (stores, total) = await _adminService.GetStoresAsync(page, limit);

                return Ok(new
                {
                    success = true,
                    data = new { stores, total, page, limit }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stores");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách cửa hàng"
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết cửa hàng
        /// </summary>
        [HttpGet("stores/{storeId}")]
        public async Task<IActionResult> GetStoreById(int storeId)
        {
            try
            {
                var store = await _adminService.GetStoreByIdAsync(storeId);
                
                if (store == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy cửa hàng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = store
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching store by id: {StoreId}", storeId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin cửa hàng"
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái cửa hàng
        /// </summary>
        [HttpPut("stores/{storeId}/status")]
        public async Task<IActionResult> UpdateStoreStatus(int storeId, [FromBody] UpdateStatusDto request)
        {
            try
            {
                var result = await _adminService.UpdateStoreStatusAsync(storeId, request.Status);
                
                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy cửa hàng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật trạng thái cửa hàng thành công"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating store status");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái cửa hàng"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng
        /// </summary>
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10,
            [FromQuery] string? status = null)
        {
            try
            {
                var (orders, total) = await _adminService.GetOrdersAsync(page, limit, status);

                return Ok(new
                {
                    success = true,
                    data = new { orders, total, page, limit }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách đơn hàng"
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn hàng
        /// </summary>
        [HttpGet("orders/{orderId}")]
        public async Task<IActionResult> GetOrderById(int orderId)
        {
            try
            {
                var order = await _adminService.GetOrderByIdAsync(orderId);
                
                if (order == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy đơn hàng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = order
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching order by id: {OrderId}", orderId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin đơn hàng"
                });
            }
        }
    }
}
