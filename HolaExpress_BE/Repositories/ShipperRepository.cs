using HolaExpress_BE.DTOs.Shipper;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class ShipperRepository : IShipperRepository
{
    private readonly HolaExpressContext _context;

    public ShipperRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<ShipperStatsDto?> GetShipperStatsAsync(int shipperId)
    {
        var today = DateTime.Today;
        
        // Get today's completed orders
        var todayOrders = await _context.Orders
            .Where(o => o.ShipperId == shipperId && 
                       o.Status == "COMPLETED" && 
                       o.CompletedAt.HasValue &&
                       o.CompletedAt.Value.Date == today)
            .ToListAsync();

        // Get current active orders
        var activeOrders = await _context.Orders
            .CountAsync(o => o.ShipperId == shipperId && 
                           (o.Status == "PICKED_UP" || o.Status == "DELIVERING"));

        // Get total deliveries
        var totalDeliveries = await _context.Orders
            .CountAsync(o => o.ShipperId == shipperId && o.Status == "COMPLETED");

        return new ShipperStatsDto
        {
            TodayEarnings = todayOrders.Sum(o => o.ShippingFee ?? 0),
            CompletedToday = todayOrders.Count,
            ActiveOrders = activeOrders,
            TotalDeliveries = totalDeliveries,
            AverageRating = 4.8 // TODO: Calculate from reviews
        };
    }

    public async Task<List<ShipperOrderDto>> GetCurrentOrdersAsync(int shipperId)
    {
        var orders = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.Customer)
            .Where(o => o.ShipperId == shipperId && 
                       (o.Status == "PICKED_UP" || o.Status == "DELIVERING"))
            .OrderBy(o => o.CreatedAt)
            .Select(o => new ShipperOrderDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreLatitude = o.Store.Latitude,
                StoreLongitude = o.Store.Longitude,
                CustomerName = o.Customer!.FullName ?? "",
                CustomerPhone = o.Customer.PhoneNumber ?? "",
                DeliveryAddress = o.DeliveryAddress ?? "",
                DeliveryLatitude = null,
                DeliveryLongitude = null,
                TotalAmount = o.TotalAmount,
                DeliveryFee = o.ShippingFee ?? 0,
                Status = o.Status ?? "",
                PickupTime = o.CreatedAt,
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                Notes = o.CustomerNote
            })
            .ToListAsync();

        return orders;
    }

    public async Task<List<ShipperOrderDto>> GetAvailableOrdersAsync(double latitude, double longitude, int radiusMeters = 5000)
    {
        // Calculate bounding box
        double latDelta = radiusMeters / 111320.0;
        double lngDelta = radiusMeters / (111320.0 * Math.Cos(latitude * Math.PI / 180.0));

        double minLat = latitude - latDelta;
        double maxLat = latitude + latDelta;
        double minLng = longitude - lngDelta;
        double maxLng = longitude + lngDelta;

        // Get orders ready for pickup with no shipper assigned
        var orders = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.Customer)
            .Where(o => o.Status == "READY" && 
                       o.ShipperId == null &&
                       o.Store!.Latitude != null &&
                       o.Store.Longitude != null &&
                       o.Store.Latitude >= minLat && o.Store.Latitude <= maxLat &&
                       o.Store.Longitude >= minLng && o.Store.Longitude <= maxLng)
            .Select(o => new ShipperOrderDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreLatitude = o.Store.Latitude,
                StoreLongitude = o.Store.Longitude,
                CustomerName = o.Customer!.FullName ?? "",
                CustomerPhone = o.Customer.PhoneNumber ?? "",
                DeliveryAddress = o.DeliveryAddress ?? "",
                DeliveryLatitude = null,
                DeliveryLongitude = null,
                TotalAmount = o.TotalAmount,
                DeliveryFee = o.ShippingFee ?? 0,
                Status = o.Status ?? "",
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                Notes = o.CustomerNote
            })
            .ToListAsync();

        // Filter by actual distance using Haversine formula
        const double R = 6371000; // Earth radius in meters
        var nearbyOrders = orders.Select(o =>
        {
            double storeLat = o.StoreLatitude ?? 0;
            double storeLng = o.StoreLongitude ?? 0;
            
            double dLat = (storeLat - latitude) * Math.PI / 180.0;
            double dLng = (storeLng - longitude) * Math.PI / 180.0;
            
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                      Math.Cos(latitude * Math.PI / 180.0) * Math.Cos(storeLat * Math.PI / 180.0) *
                      Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            double distance = R * c;
            
            o.Distance = distance; // Set distance in DTO
            
            return new { Order = o, Distance = distance };
        })
        .Where(x => x.Distance <= radiusMeters)
        .OrderBy(x => x.Order.CreatedAt)
        .Select(x => x.Order)
        .ToList();

        return nearbyOrders;
    }

    public async Task<List<ShipperOrderDto>> GetOrderHistoryAsync(int shipperId, int page = 1, int pageSize = 20)
    {
        var orders = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.Customer)
            .Where(o => o.ShipperId == shipperId && o.Status == "COMPLETED")
            .OrderByDescending(o => o.CompletedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new ShipperOrderDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                CustomerName = o.Customer!.FullName ?? "",
                CustomerPhone = o.Customer.PhoneNumber ?? "",
                DeliveryAddress = o.DeliveryAddress ?? "",
                TotalAmount = o.TotalAmount,
                DeliveryFee = o.ShippingFee ?? 0,
                Status = o.Status ?? "",
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return orders;
    }

    public async Task<ShipperEarningsDto?> GetEarningsAsync(int shipperId)
    {
        var today = DateTime.Today;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var completedOrders = await _context.Orders
            .Where(o => o.ShipperId == shipperId && 
                       o.Status == "COMPLETED" && 
                       o.CompletedAt.HasValue)
            .ToListAsync();

        var todayOrders = completedOrders.Where(o => o.CompletedAt!.Value.Date == today);
        var weekOrders = completedOrders.Where(o => o.CompletedAt!.Value.Date >= weekStart);
        var monthOrders = completedOrders.Where(o => o.CompletedAt!.Value.Date >= monthStart);

        // Get daily breakdown for last 7 days
        var dailyBreakdown = completedOrders
            .Where(o => o.CompletedAt!.Value.Date >= today.AddDays(-6))
            .GroupBy(o => o.CompletedAt!.Value.Date)
            .Select(g => new DailyEarningDto
            {
                Date = g.Key,
                Earnings = g.Sum(o => o.ShippingFee ?? 0),
                DeliveriesCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        return new ShipperEarningsDto
        {
            TodayEarnings = todayOrders.Sum(o => o.ShippingFee ?? 0),
            WeekEarnings = weekOrders.Sum(o => o.ShippingFee ?? 0),
            MonthEarnings = monthOrders.Sum(o => o.ShippingFee ?? 0),
            TotalEarnings = completedOrders.Sum(o => o.ShippingFee ?? 0),
            TotalDeliveries = completedOrders.Count,
            DailyBreakdown = dailyBreakdown
        };
    }

    public async Task<bool> UpdateStatusAsync(int shipperId, bool isOnline, double? latitude, double? longitude, string? formattedAddress)
    {
        var shipperProfile = await _context.ShipperProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == shipperId);

        if (shipperProfile == null)
            return false;

        shipperProfile.IsOnline = isOnline;
        
        if (latitude.HasValue && longitude.HasValue)
        {
            shipperProfile.CurrentLat = latitude;
            shipperProfile.CurrentLong = longitude;
            shipperProfile.FormattedAddress = formattedAddress;
            shipperProfile.LastLocationUpdate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AcceptOrderAsync(int orderId, int shipperId)
    {
        var order = await _context.Orders.FindAsync(orderId);
        
        if (order == null || order.Status != "READY" || order.ShipperId != null)
            return false;

        // Verify shipper is online
        var shipperProfile = await _context.ShipperProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == shipperId && sp.IsOnline == true);

        if (shipperProfile == null)
            return false;

        order.ShipperId = shipperId;
        order.Status = "PICKED_UP";
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, int shipperId, string status)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.ShipperId == shipperId);

        if (order == null)
            return false;

        // Validate status transitions
        var validTransitions = new Dictionary<string, string[]>
        {
            { "PICKED_UP", new[] { "DELIVERING" } },
            { "DELIVERING", new[] { "COMPLETED" } }
        };

        if (!validTransitions.ContainsKey(order.Status ?? "") || 
            !validTransitions[order.Status ?? ""].Contains(status))
            return false;

        order.Status = status;
        
        if (status == "COMPLETED")
        {
            order.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateLocationAsync(int shipperId, double latitude, double longitude, string? formattedAddress)
    {
        var shipperProfile = await _context.ShipperProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == shipperId);

        if (shipperProfile == null)
            return false;

        shipperProfile.CurrentLat = latitude;
        shipperProfile.CurrentLong = longitude;
        shipperProfile.FormattedAddress = formattedAddress;
        shipperProfile.LastLocationUpdate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ShipperProfile> CreateShipperProfileAsync(ShipperProfile profile)
    {
        _context.ShipperProfiles.Add(profile);
        await _context.SaveChangesAsync();
        return profile;
    }

    public async Task<List<NearbyDriverDto>> GetNearbyDriversAsync(
        double latitude, double longitude, double radiusKm = 5, string? vehicleType = null)
    {
        // Pull all online shippers that have a location AND are not currently on an active trip
        var busyShipperIds = await _context.Orders
            .Where(o => o.ShipperId != null && (o.Status == "PICKED_UP" || o.Status == "DELIVERING"))
            .Select(o => o.ShipperId!.Value)
            .ToListAsync();

        var query = _context.ShipperProfiles
            .Include(sp => sp.User)
            .Where(sp => sp.IsOnline == true
                      && sp.CurrentLat.HasValue
                      && sp.CurrentLong.HasValue
                      && !busyShipperIds.Contains(sp.UserId!.Value));

        if (!string.IsNullOrEmpty(vehicleType))
            query = query.Where(sp => sp.VehicleType == vehicleType);

        var profiles = await query.ToListAsync();

        // Filter by radius and build DTOs
        var result = new List<NearbyDriverDto>();
        foreach (var sp in profiles)
        {
            var dist = HaversineKm(latitude, longitude, sp.CurrentLat!.Value, sp.CurrentLong!.Value);
            if (dist > radiusKm) continue;

            // Calculate average shipper rating from Reviews
            var ratingData = await _context.Reviews
                .Where(r => r.Order != null && r.Order.ShipperId == sp.UserId
                         && r.ShipperRating.HasValue)
                .Select(r => (double)r.ShipperRating!.Value)
                .ToListAsync();

            var avgRating = ratingData.Count > 0
                ? Math.Round(ratingData.Average(), 1)
                : 5.0;

            var totalTrips = await _context.Orders
                .CountAsync(o => o.ShipperId == sp.UserId && o.Status == "COMPLETED");

            result.Add(new NearbyDriverDto
            {
                UserId     = sp.UserId ?? 0,
                FullName   = sp.User?.FullName ?? "Tài xế",
                Rating     = avgRating,
                TotalTrips = totalTrips,
                VehicleType  = sp.VehicleType ?? "MOTORCYCLE",
                VehiclePlate = sp.VehiclePlate ?? "",
                VehicleName  = null,     // not stored in DB yet
                Lat        = sp.CurrentLat!.Value,
                Lng        = sp.CurrentLong!.Value,
                IsOnline   = sp.IsOnline ?? false,
                DistanceKm = Math.Round(dist, 2),
                AvatarUrl  = sp.User?.AvatarUrl,
            });
        }

        return result.OrderBy(d => d.DistanceKm).ToList();
    }

    // Haversine formula – returns distance in km
    private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
