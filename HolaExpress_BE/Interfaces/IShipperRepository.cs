using HolaExpress_BE.DTOs.Shipper;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IShipperRepository
{
    Task<ShipperStatsDto?> GetShipperStatsAsync(int shipperId);
    Task<List<ShipperOrderDto>> GetCurrentOrdersAsync(int shipperId);
    Task<List<ShipperOrderDto>> GetAvailableOrdersAsync(double latitude, double longitude, int radiusMeters = 5000);
    Task<List<ShipperOrderDto>> GetOrderHistoryAsync(int shipperId, int page = 1, int pageSize = 20);
    Task<ShipperEarningsDto?> GetEarningsAsync(int shipperId);
    Task<bool> UpdateStatusAsync(int shipperId, bool isOnline, double? latitude, double? longitude, string? formattedAddress);
    Task<bool> AcceptOrderAsync(int orderId, int shipperId);
    Task<bool> UpdateOrderStatusAsync(int orderId, int shipperId, string status);
    Task<bool> UpdateLocationAsync(int shipperId, double latitude, double longitude, string? formattedAddress);
    Task<ShipperProfile> CreateShipperProfileAsync(ShipperProfile profile);
}
