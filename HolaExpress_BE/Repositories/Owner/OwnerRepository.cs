#nullable disable
using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Repositories.Owner;

public class OwnerRepository : IOwnerRepository
{
    private readonly HolaExpressContext _context;

    public OwnerRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<Store?> GetStoreByOwnerIdAsync(int ownerId, int? storeId = null)
    {
        var query = _context.Stores.Where(s => s.OwnerId == ownerId);
        
        if (storeId.HasValue)
        {
            query = query.Where(s => s.StoreId == storeId.Value);
        }
        
        return await query.FirstOrDefaultAsync();
    }

    public async Task<decimal> GetTodayRevenueAsync(int storeId)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= today 
                && o.CreatedAt < tomorrow
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
    }

    public async Task<decimal> GetYesterdayRevenueAsync(int storeId)
    {
        var yesterday = DateTime.Today.AddDays(-1);
        var today = DateTime.Today;
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= yesterday 
                && o.CreatedAt < today
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
    }

    public async Task<int> GetTodayOrdersCountAsync(int storeId)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= today 
                && o.CreatedAt < tomorrow
                && o.Status != "CANCELLED")
            .CountAsync();
    }

    public async Task<int> GetYesterdayOrdersCountAsync(int storeId)
    {
        var yesterday = DateTime.Today.AddDays(-1);
        var today = DateTime.Today;
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= yesterday 
                && o.CreatedAt < today
                && o.Status != "CANCELLED")
            .CountAsync();
    }

    public async Task<int> GetTodayProductsSoldAsync(int storeId)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= today 
                && o.CreatedAt < tomorrow
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .SelectMany(o => o.OrderDetails)
            .SumAsync(od => od.Quantity);
    }

    public async Task<int> GetYesterdayProductsSoldAsync(int storeId)
    {
        var yesterday = DateTime.Today.AddDays(-1);
        var today = DateTime.Today;
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= yesterday 
                && o.CreatedAt < today
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .SelectMany(o => o.OrderDetails)
            .SumAsync(od => od.Quantity);
    }

    public async Task<decimal> GetAverageRatingAsync(int storeId)
    {
        var rating = await _context.Reviews
            .Where(r => r.Order.StoreId == storeId && r.CreatedAt >= DateTime.Today.AddDays(-30))
            .AverageAsync(r => (decimal?)r.StoreRating) ?? 0;
            
        return Math.Round(rating, 1);
    }

    public async Task<decimal> GetLastWeekAverageRatingAsync(int storeId)
    {
        var lastWeekStart = DateTime.Today.AddDays(-37);
        var lastWeekEnd = DateTime.Today.AddDays(-30);
        
        var rating = await _context.Reviews
            .Where(r => r.Order.StoreId == storeId 
                && r.CreatedAt >= lastWeekStart 
                && r.CreatedAt < lastWeekEnd)
            .AverageAsync(r => (decimal?)r.StoreRating) ?? 0;
            
        return Math.Round(rating, 1);
    }

    public async Task<int> GetTodayNewCustomersAsync(int storeId)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= today 
                && o.CreatedAt < tomorrow)
            .Select(o => o.CustomerId)
            .Distinct()
            .CountAsync();
    }

    public async Task<int> GetYesterdayNewCustomersAsync(int storeId)
    {
        var yesterday = DateTime.Today.AddDays(-1);
        var today = DateTime.Today;
        
        return await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= yesterday 
                && o.CreatedAt < today)
            .Select(o => o.CustomerId)
            .Distinct()
            .CountAsync();
    }

    public async Task<int> GetLowStockItemsCountAsync(int storeId)
    {
        return await _context.Ingredients
            .Where(i => i.StoreId == storeId && i.CurrentStock < i.MinStockAlert)
            .CountAsync();
    }

    public async Task<List<Order>> GetRecentOrdersAsync(int storeId, int limit)
    {
        return await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.OrderDetails)
            .Where(o => o.StoreId == storeId)
            .OrderByDescending(o => o.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<(int ProductId, string ProductName, string? ImageUrl, int TotalSold, decimal Revenue)>> GetTopSellingProductsAsync(int storeId, int days, int limit)
    {
        var startDate = DateTime.Today.AddDays(-days);
        
        var topProducts = await _context.OrderDetails
            .Where(od => od.Order.StoreId == storeId 
                && od.Order.CreatedAt >= startDate
                && (od.Order.Status == "COMPLETED" || od.Order.Status == "DELIVERED"))
            .GroupBy(od => new { od.ProductId, od.Product.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalSold = g.Sum(od => od.Quantity),
                Revenue = g.Sum(od => od.Quantity * (od.PriceSnapshot ?? 0))
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(limit)
            .ToListAsync();

        var result = new List<(int, string, string?, int, decimal)>();
        
        foreach (var item in topProducts)
        {
            if (!item.ProductId.HasValue) continue;
            
            var imageUrl = await _context.MediaMappings
                .Where(mm => mm.EntityId == item.ProductId && mm.EntityType == "PRODUCT")
                .OrderBy(mm => mm.MappingId)
                .Select(mm => mm.Media.FilePath)
                .FirstOrDefaultAsync();
                
            result.Add((item.ProductId.Value, item.ProductName ?? "", imageUrl, item.TotalSold, item.Revenue));
        }
        
        return result;
    }

    public async Task<(decimal TotalRevenue, int TotalOrders)> GetRevenueSummaryAsync(int storeId, DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= startDate 
                && o.CreatedAt <= endDate
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;

        return (totalRevenue, totalOrders);
    }

    public async Task<List<(DateTime Date, decimal Revenue, int Orders)>> GetDailyRevenueAsync(int storeId, DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Where(o => o.StoreId == storeId 
                && o.CreatedAt >= startDate 
                && o.CreatedAt <= endDate
                && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
            .ToListAsync();

        var dailyRevenue = orders
            .GroupBy(o => o.CreatedAt.Value.Date)
            .Select(g => (
                Date: g.Key,
                Revenue: g.Sum(o => o.TotalAmount),
                Orders: g.Count()
            ))
            .OrderBy(x => x.Date)
            .ToList();

        return dailyRevenue;
    }
}
