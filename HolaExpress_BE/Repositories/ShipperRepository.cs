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
}
