using HolaExpress_BE.DTOs.Shipper;

namespace HolaExpress_BE.Interfaces;

public interface IShipperService
{
    Task<ShipperDashboardDto?> GetDashboardAsync(int shipperId);
    Task<List<ShipperOrderDto>> GetAvailableOrdersAsync(int shipperId, double latitude, double longitude, int radiusMeters = 5000);
    Task<List<ShipperOrderDto>> GetOrderHistoryAsync(int shipperId, int page = 1, int pageSize = 20);
    Task<ShipperEarningsDto?> GetEarningsAsync(int shipperId);
    Task<bool> UpdateStatusAsync(int shipperId, bool isOnline, double? latitude, double? longitude);
    Task<bool> AcceptOrderAsync(int orderId, int shipperId);
    Task<bool> UpdateOrderStatusAsync(int orderId, int shipperId, string status);
    Task<bool> UpdateLocationAsync(int shipperId, UpdateLocationDto locationDto);
}
