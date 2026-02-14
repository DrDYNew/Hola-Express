#nullable disable
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly HolaExpressContext _context;

    public ProductRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<Product?> GetProductByIdAsync(int productId)
    {
        try
        {
            return await _context.Products
                .Include(p => p.Store)
                .Where(p => p.ProductId == productId)
                .FirstOrDefaultAsync();
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<List<ProductVariant>> GetProductVariantsAsync(int productId)
    {
        try
        {
            return await _context.ProductVariants
                .Where(v => v.ProductId == productId)
                .OrderBy(v => v.PriceAdjustment)
                .ToListAsync();
        }
        catch (Exception)
        {
            return new List<ProductVariant>();
        }
    }

    public async Task<List<Topping>> GetProductToppingsAsync(int productId)
    {
        try
        {
            // Get toppings mapped to this product via ProductToppings table
            var toppingIds = await _context.Set<ProductTopping>()
                .Where(pt => pt.ProductId == productId)
                .Select(pt => pt.ToppingId)
                .ToListAsync();

            if (!toppingIds.Any())
            {
                return new List<Topping>();
            }

            // Get the actual topping details
            return await _context.Toppings
                .Where(t => toppingIds.Contains(t.ToppingId) && t.IsAvailable == true)
                .OrderBy(t => t.ToppingName)
                .ToListAsync();
        }
        catch (Exception)
        {
            return new List<Topping>();
        }
    }

    public async Task<List<string>> GetProductImagesAsync(int productId)
    {
        try
        {
            return await _context.MediaMappings
                .Where(mm => mm.EntityType == "Product" && mm.EntityId == productId)
                .Join(_context.Medias,
                    mm => mm.MediaId,
                    m => m.MediaId,
                    (mm, m) => new { mm.DisplayOrder, m.FilePath })
                .OrderBy(x => x.DisplayOrder)
                .Select(x => x.FilePath)
                .ToListAsync();
        }
        catch (Exception)
        {
            return new List<string>();
        }
    }

    public async Task<List<Product>> GetSimilarProductsAsync(int productId, int categoryId, int limit = 10)
    {
        try
        {
            return await _context.Products
                .Include(p => p.Store)
                .Where(p => p.CategoryId == categoryId 
                    && p.ProductId != productId 
                    && p.IsActive == true 
                    && p.IsSoldOut == false)
                .OrderBy(p => Guid.NewGuid())
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception)
        {
            return new List<Product>();
        }
    }
}
