#nullable disable
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class StoreRepository : IStoreRepository
{
    private readonly HolaExpressContext _context;

    public StoreRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<Store?> GetStoreByIdAsync(int storeId)
    {
        return await _context.Stores
            .Where(s => s.StoreId == storeId && s.IsActive == true)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Category>> GetStoreCategoriesAsync(int storeId)
    {
        return await _context.Categories
            .Where(c => c.StoreId == storeId)
            .OrderBy(c => c.Priority)
            .ToListAsync();
    }

    public async Task<List<Product>> GetStoreProductsAsync(int storeId, int? categoryId = null)
    {
        var query = _context.Products
            .Include(p => p.Store)
            .Where(p => p.StoreId == storeId && p.IsActive == true);

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        return await query.ToListAsync();
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
}
