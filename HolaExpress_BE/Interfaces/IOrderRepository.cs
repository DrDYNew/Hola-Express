using HolaExpress_BE.DTOs.Order;

namespace HolaExpress_BE.Interfaces;

public interface IOrderRepository
{
    Task<List<OrderListDto>> GetOwnerOrdersAsync(int ownerId, string? status = null, int? storeId = null);
    Task<OrderListDto?> GetOrderByIdAsync(int orderId, int ownerId);
    Task<bool> UpdateOrderStatusAsync(int orderId, int ownerId, string status);
    Task<List<ShipperDto>> GetNearbyShippersAsync(double latitude, double longitude, int radiusMeters);
    Task<bool> AssignShipperAsync(int orderId, int ownerId, int shipperId);
    Task<List<OrderHistoryDto>> GetCustomerOrderHistoryAsync(int customerId, string? status = null, int pageNumber = 1, int pageSize = 20);
    Task<OrderHistoryDto?> GetCustomerOrderByIdAsync(int orderId, int customerId);
}
