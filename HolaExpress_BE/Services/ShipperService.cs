using HolaExpress_BE.DTOs.Shipper;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Services;

public class ShipperService : IShipperService
{
    private readonly IShipperRepository _shipperRepository;
    private readonly IMapsService _mapsService;

    public ShipperService(IShipperRepository shipperRepository, IMapsService mapsService)
    {
        _shipperRepository = shipperRepository;
        _mapsService = mapsService;
    }

    public async Task<ShipperDashboardDto?> GetDashboardAsync(int shipperId)
    {
        var stats = await _shipperRepository.GetShipperStatsAsync(shipperId);
        if (stats == null)
            return null;

        var currentOrders = await _shipperRepository.GetCurrentOrdersAsync(shipperId);

        return new ShipperDashboardDto
        {
            Stats = stats,
            CurrentOrders = currentOrders
        };
    }

    public async Task<List<ShipperOrderDto>> GetAvailableOrdersAsync(int shipperId, double latitude, double longitude, int radiusMeters = 5000)
    {
        return await _shipperRepository.GetAvailableOrdersAsync(latitude, longitude, radiusMeters);
    }

    public async Task<List<ShipperOrderDto>> GetOrderHistoryAsync(int shipperId, int page = 1, int pageSize = 20)
    {
        return await _shipperRepository.GetOrderHistoryAsync(shipperId, page, pageSize);
    }

    public async Task<ShipperEarningsDto?> GetEarningsAsync(int shipperId)
    {
        return await _shipperRepository.GetEarningsAsync(shipperId);
    }

    public async Task<bool> UpdateStatusAsync(int shipperId, bool isOnline, double? latitude, double? longitude)
    {
        string? formattedAddress = null;
        
        // Call Google Maps API to get formatted address from coordinates
        if (latitude.HasValue && longitude.HasValue)
        {
            try
            {
                var geocodeResult = await _mapsService.ReverseGeocodeAsync(latitude.Value, longitude.Value);
                if (geocodeResult?.Results?.Count > 0)
                {
                    formattedAddress = geocodeResult.Results[0].FormattedAddress;
                }
            }
            catch (Exception)
            {
                // Continue even if reverse geocoding fails
                formattedAddress = null;
            }
        }
        
        return await _shipperRepository.UpdateStatusAsync(shipperId, isOnline, latitude, longitude, formattedAddress);
    }

    public async Task<bool> AcceptOrderAsync(int orderId, int shipperId)
    {
        return await _shipperRepository.AcceptOrderAsync(orderId, shipperId);
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, int shipperId, string status)
    {
        return await _shipperRepository.UpdateOrderStatusAsync(orderId, shipperId, status);
    }

    public async Task<bool> UpdateLocationAsync(int shipperId, UpdateLocationDto locationDto)
    {
        string? formattedAddress = locationDto.FormattedAddress;
        
        // If no formatted address provided, try to get it from reverse geocoding
        if (string.IsNullOrEmpty(formattedAddress))
        {
            try
            {
                var geocodeResult = await _mapsService.ReverseGeocodeAsync(locationDto.Latitude, locationDto.Longitude);
                if (geocodeResult?.Results?.Count > 0)
                {
                    formattedAddress = geocodeResult.Results[0].FormattedAddress;
                }
            }
            catch (Exception)
            {
                // Continue even if reverse geocoding fails
                formattedAddress = null;
            }
        }

        return await _shipperRepository.UpdateLocationAsync(
            shipperId, 
            locationDto.Latitude, 
            locationDto.Longitude, 
            formattedAddress
        );
    }

    public Task<List<NearbyDriverDto>> GetNearbyDriversAsync(
        double latitude, double longitude, double radiusKm = 5, string? vehicleType = null)
    {
        return _shipperRepository.GetNearbyDriversAsync(latitude, longitude, radiusKm, vehicleType);
    }
}
