using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class HomeRepository : IHomeRepository
{
    private readonly HolaExpressContext _context;

    public HomeRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await _context.Categories
            .Include(c => c.Store)
            .Where(c => c.Store != null && c.Store.IsActive == true)
            .ToListAsync();
    }

    public async Task<List<Store>> GetStoresAsync(int page, int limit)
    {
        return await _context.Stores
            .Where(s => s.IsActive == true)
            .OrderByDescending(s => s.Rating)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<Store>> GetNearbyStoresAsync()
    {
        return await _context.Stores
            .Where(s => s.IsActive == true && s.IsOpenNow == true)
            .OrderByDescending(s => s.Rating)
            .Take(20)
            .ToListAsync();
    }

    public async Task<List<Product>> GetProductsAsync(int? categoryId, int? storeId)
    {
        var query = _context.Products
            .Include(p => p.Store)
            .Where(p => p.IsActive == true && p.IsSoldOut == false);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (storeId.HasValue)
            query = query.Where(p => p.StoreId == storeId.Value);

        return await query.ToListAsync();
    }

    public async Task<List<Product>> GetFlashSaleProductsAsync()
    {
        return await _context.Products
            .Include(p => p.Store)
            .Where(p => p.IsActive == true && p.IsSoldOut == false)
            .OrderBy(p => Guid.NewGuid())
            .Take(10)
            .ToListAsync();
    }

    public async Task<List<Product>> GetRecommendedProductsAsync()
    {
        return await _context.Products
            .Include(p => p.Store)
            .Where(p => p.IsActive == true && p.IsSoldOut == false)
            .OrderByDescending(p => p.Store!.Rating)
            .Take(10)
            .ToListAsync();
    }

    public async Task<List<Banner>> GetActiveBannersAsync()
    {
        return await _context.Banners
            .Where(b => b.IsActive == true && b.ImageUrl != null)
            .OrderBy(b => b.Priority)
            .ToListAsync();
    }

    public async Task<List<string>> GetProductImagesAsync(int productId)
    {
        return await _context.MediaMappings
            .Where(mm => mm.EntityType == "Product" && mm.EntityId == productId)
            .Join(
                _context.Medias,
                mm => mm.MediaId,
                m => m.MediaId,
                (mm, m) => new { mm.DisplayOrder, m.FilePath }
            )
            .OrderBy(x => x.DisplayOrder)
            .Select(x => x.FilePath)
            .ToListAsync();
    }

    public async Task<decimal> GetStoreAverageRatingAsync(int storeId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.Order != null && r.Order.StoreId == storeId && r.StoreRating.HasValue)
            .Select(r => r.StoreRating!.Value)
            .ToListAsync();

        if (reviews.Count == 0)
            return 0m;

        return (decimal)reviews.Average();
    }

    public async Task<Dictionary<int, List<string>>> GetProductImagesBatchAsync(List<int> productIds)
    {
        var imageData = await _context.MediaMappings
            .Where(mm => mm.EntityType == "Product" && productIds.Contains(mm.EntityId))
            .Join(
                _context.Medias,
                mm => mm.MediaId,
                m => m.MediaId,
                (mm, m) => new { mm.EntityId, mm.DisplayOrder, m.FilePath }
            )
            .OrderBy(x => x.EntityId)
            .ThenBy(x => x.DisplayOrder)
            .ToListAsync();

        return imageData
            .GroupBy(x => x.EntityId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.FilePath).ToList()
            );
    }
}
