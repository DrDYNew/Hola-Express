using HolaExpress_BE.DTOs.Order;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly HolaExpressContext _context;

    public OrderRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<List<OrderListDto>> GetOwnerOrdersAsync(int ownerId, string? status = null, int? storeId = null)
    {
        var query = _context.Orders
            .Include(o => o.Store)
            .Include(o => o.Customer)
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.OrderDetailToppings)
            .Where(o => o.Store!.OwnerId == ownerId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(o => o.Status == status);
        }

        if (storeId.HasValue)
        {
            query = query.Where(o => o.StoreId == storeId.Value);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                CustomerName = o.Customer!.FullName ?? "",
                CustomerPhone = o.Customer.PhoneNumber ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreLatitude = o.Store.Latitude.GetValueOrDefault(),
                StoreLongitude = o.Store.Longitude.GetValueOrDefault(),
                DeliveryAddress = o.DeliveryAddress ?? "",
                DeliveryLatitude = null, // Would need to parse from address or store in separate column
                DeliveryLongitude = null,
                TotalAmount = o.TotalAmount,
                Status = o.Status ?? "",
                CreatedAt = o.CreatedAt.GetValueOrDefault(DateTime.Now),
                Items = o.OrderDetails.Select(od => new OrderItemDto
                {
                    ProductName = od.ProductNameSnapshot ?? "",
                    VariantName = od.VariantNameSnapshot,
                    Quantity = od.Quantity,
                    Price = od.PriceSnapshot ?? 0,
                    Toppings = od.OrderDetailToppings
                        .Select(t => t.ToppingNameSnapshot ?? "")
                        .ToList()
                }).ToList()
            })
            .ToListAsync();

        return orders;
    }

    public async Task<OrderListDto?> GetOrderByIdAsync(int orderId, int ownerId)
    {
        var order = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.Customer)
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.OrderDetailToppings)
            .Where(o => o.OrderId == orderId && o.Store!.OwnerId == ownerId)
            .Select(o => new OrderListDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                CustomerName = o.Customer!.FullName ?? "",
                CustomerPhone = o.Customer.PhoneNumber ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreLatitude = o.Store.Latitude.GetValueOrDefault(),
                StoreLongitude = o.Store.Longitude.GetValueOrDefault(),
                DeliveryAddress = o.DeliveryAddress ?? "",
                TotalAmount = o.TotalAmount,
                Status = o.Status ?? "",
                CreatedAt = o.CreatedAt.GetValueOrDefault(DateTime.Now),
                Items = o.OrderDetails.Select(od => new OrderItemDto
                {
                    ProductName = od.ProductNameSnapshot ?? "",
                    VariantName = od.VariantNameSnapshot,
                    Quantity = od.Quantity,
                    Price = od.PriceSnapshot ?? 0,
                    Toppings = od.OrderDetailToppings
                        .Select(t => t.ToppingNameSnapshot ?? "")
                        .ToList()
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return order;
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, int ownerId, string status)
    {
        var order = await _context.Orders
            .Include(o => o.Store)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.Store!.OwnerId == ownerId);

        if (order == null)
            return false;

        order.Status = status;

        if (status == "COMPLETED")
        {
            order.CompletedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ShipperDto>> GetNearbyShippersAsync(double latitude, double longitude, int radiusMeters)
    {
        // Calculate bounding box for efficient query
        double latDelta = radiusMeters / 111320.0; // 1 degree latitude = ~111.32 km
        double lonDelta = radiusMeters / (111320.0 * Math.Cos(latitude * Math.PI / 180.0));

        var shippers = await _context.ShipperProfiles
            .Include(sp => sp.User)
            .Where(sp => sp.IsOnline == true
                && sp.CurrentLat != null
                && sp.CurrentLong != null
                && sp.CurrentLat >= latitude - latDelta
                && sp.CurrentLat <= latitude + latDelta
                && sp.CurrentLong >= longitude - lonDelta
                && sp.CurrentLong <= longitude + lonDelta)
            .Select(sp => new ShipperDto
            {
                UserId = sp.UserId ?? 0,
                FullName = sp.User!.FullName ?? "",
                PhoneNumber = sp.User.PhoneNumber ?? "",
                CurrentLat = sp.CurrentLat ?? 0,
                CurrentLong = sp.CurrentLong ?? 0,
                IsOnline = sp.IsOnline ?? false
            })
            .ToListAsync();

        // Filter by actual distance using Haversine formula
        var nearbyShippers = shippers.Where(s =>
        {
            var distance = CalculateDistance(latitude, longitude, s.CurrentLat, s.CurrentLong);
            return distance <= radiusMeters;
        }).ToList();

        return nearbyShippers;
    }

    public async Task<bool> AssignShipperAsync(int orderId, int ownerId, int shipperId)
    {
        var order = await _context.Orders
            .Include(o => o.Store)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.Store!.OwnerId == ownerId);

        if (order == null || order.Status != "READY")
            return false;

        // Verify shipper exists and is online
        var shipper = await _context.ShipperProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == shipperId && sp.IsOnline == true);

        if (shipper == null)
            return false;

        order.ShipperId = shipperId;
        order.Status = "PICKED_UP";

        await _context.SaveChangesAsync();
        return true;
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000; // Earth's radius in meters
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c; // Distance in meters
    }

    private double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }

    public async Task<List<OrderHistoryDto>> GetCustomerOrderHistoryAsync(int customerId, string? status = null, int pageNumber = 1, int pageSize = 20)
    {
        var query = _context.Orders
            .Include(o => o.Store)
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.OrderDetailToppings)
            .Where(o => o.CustomerId == customerId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(o => o.Status == status);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderHistoryDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreImageUrl = null,
                DeliveryAddress = o.DeliveryAddress ?? "",
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee ?? 0,
                DiscountAmount = o.DiscountAmount,
                TotalAmount = o.TotalAmount,
                Status = o.Status ?? "",
                PaymentMethod = o.PaymentMethod ?? "",
                PaymentStatus = o.PaymentStatus ?? "",
                CreatedAt = o.CreatedAt.GetValueOrDefault(DateTime.Now),
                CompletedAt = o.CompletedAt,
                CustomerNote = o.CustomerNote,
                CancelReason = o.CancelReason,
                Items = o.OrderDetails.Select(od => new OrderHistoryItemDto
                {
                    DetailId = od.DetailId,
                    ProductName = od.ProductNameSnapshot ?? "",
                    VariantName = od.VariantNameSnapshot,
                    Quantity = od.Quantity,
                    Price = od.PriceSnapshot ?? 0,
                    TotalPrice = od.TotalPrice ?? 0,
                    Toppings = od.OrderDetailToppings
                        .Select(t => t.ToppingNameSnapshot ?? "")
                        .ToList()
                }).ToList()
            })
            .ToListAsync();

        return orders;
    }

    public async Task<OrderHistoryDto?> GetCustomerOrderByIdAsync(int orderId, int customerId)
    {
        var order = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.OrderDetailToppings)
            .Where(o => o.OrderId == orderId && o.CustomerId == customerId)
            .Select(o => new OrderHistoryDto
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? "",
                StoreName = o.Store!.StoreName ?? "",
                StoreAddress = o.Store.Address ?? "",
                StoreImageUrl = null,
                DeliveryAddress = o.DeliveryAddress ?? "",
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee ?? 0,
                DiscountAmount = o.DiscountAmount,
                TotalAmount = o.TotalAmount,
                Status = o.Status ?? "",
                PaymentMethod = o.PaymentMethod ?? "",
                PaymentStatus = o.PaymentStatus ?? "",
                CreatedAt = o.CreatedAt.GetValueOrDefault(DateTime.Now),
                CompletedAt = o.CompletedAt,
                CustomerNote = o.CustomerNote,
                CancelReason = o.CancelReason,
                Items = o.OrderDetails.Select(od => new OrderHistoryItemDto
                {
                    DetailId = od.DetailId,
                    ProductName = od.ProductNameSnapshot ?? "",
                    VariantName = od.VariantNameSnapshot,
                    Quantity = od.Quantity,
                    Price = od.PriceSnapshot ?? 0,
                    TotalPrice = od.TotalPrice ?? 0,
                    Toppings = od.OrderDetailToppings
                        .Select(t => t.ToppingNameSnapshot ?? "")
                        .ToList()
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return order;
    }
}

