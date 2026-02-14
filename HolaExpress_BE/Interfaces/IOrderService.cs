using HolaExpress_BE.DTOs.Order;

namespace HolaExpress_BE.Interfaces;

public interface IOrderService
{
    Task<CreateOrderResponseDto> CreateOrderAsync(int userId, CreateOrderDto request);
    Task<List<OrderListDto>> GetOwnerOrdersAsync(int ownerId, string? status = null, int? storeId = null);
    Task<OrderListDto?> GetOrderByIdAsync(int orderId, int ownerId);
    Task<bool> ConfirmOrderAsync(int orderId, int ownerId);
    Task<bool> StartPreparingAsync(int orderId, int ownerId);
    Task<bool> MarkReadyAsync(int orderId, int ownerId);
    Task<bool> CancelOrderAsync(int orderId, int ownerId);
    Task<List<ShipperDto>> GetNearbyShippersAsync(int orderId, int ownerId, int radiusMeters = 5000);
    Task<bool> AssignShipperAsync(int orderId, int ownerId, int shipperId);
    Task<List<OrderHistoryDto>> GetCustomerOrderHistoryAsync(int customerId, string? status = null, int pageNumber = 1, int pageSize = 20);
    Task<OrderHistoryDto?> GetCustomerOrderByIdAsync(int orderId, int customerId);
    Task<ShipperTrackingDto?> GetShipperTrackingAsync(int orderId, int customerId);
}
