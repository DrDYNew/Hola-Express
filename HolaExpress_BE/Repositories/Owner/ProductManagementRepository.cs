using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Repositories.Owner;

public class ProductManagementRepository : IProductManagementRepository
{
    private readonly HolaExpressContext _context;

    public ProductManagementRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductDto>> GetOwnerProductsAsync(int ownerId, int? storeId = null)
    {
        var query = _context.Products
            .Include(p => p.Store)
            .Include(p => p.Category)
            .Where(p => p.Store.OwnerId == ownerId);

        if (storeId.HasValue)
        {
            // Filter by products that are in the specified store
            query = query.Where(p => 
                p.StoreId == storeId.Value || 
                _context.ProductStores.Any(ps => ps.ProductId == p.ProductId && ps.StoreId == storeId.Value)
            );
        }

        return await query
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? string.Empty,
                Description = p.Description ?? string.Empty,
                BasePrice = p.BasePrice,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.CategoryName : null,
                StoreId = p.StoreId ?? 0,
                StoreName = p.Store != null ? p.Store.StoreName : null,
                StoreIds = _context.ProductStores
                    .Where(ps => ps.ProductId == p.ProductId)
                    .Select(ps => ps.StoreId)
                    .ToList(),
                StoreNames = _context.ProductStores
                    .Where(ps => ps.ProductId == p.ProductId)
                    .Select(ps => ps.Store.StoreName)
                    .ToList(),
                IsAvailable = (p.IsActive ?? false) && !(p.IsSoldOut ?? false),
                IsFeatured = false, // Not in DB
                DiscountPercent = null, // Not in DB
                ImageUrls = _context.MediaMappings
                    .Where(mm => mm.EntityType == "Product" && mm.EntityId == p.ProductId)
                    .OrderBy(mm => mm.DisplayOrder)
                    .Select(mm => mm.Media.FilePath)
                    .ToList(),
                Toppings = _context.ProductToppings
                    .Where(pt => pt.ProductId == p.ProductId)
                    .Select(pt => new ToppingDto
                    {
                        ToppingId = pt.Topping.ToppingId,
                        ToppingName = pt.Topping.ToppingName ?? string.Empty,
                        Price = pt.Topping.Price ?? 0,
                        IsAvailable = pt.Topping.IsAvailable ?? false
                    })
                    .ToList()
            })
            .OrderByDescending(p => p.ProductId)
            .ToListAsync();
    }

    public async Task<ProductDto?> GetProductByIdAsync(int productId, int ownerId)
    {
        return await _context.Products
            .Include(p => p.Store)
            .Include(p => p.Category)
            .Where(p => p.ProductId == productId && p.Store.OwnerId == ownerId)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? string.Empty,
                Description = p.Description ?? string.Empty,
                BasePrice = p.BasePrice,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.CategoryName : null,
                StoreId = p.StoreId ?? 0,
                StoreName = p.Store != null ? p.Store.StoreName : null,
                StoreIds = _context.ProductStores
                    .Where(ps => ps.ProductId == p.ProductId)
                    .Select(ps => ps.StoreId)
                    .ToList(),
                StoreNames = _context.ProductStores
                    .Where(ps => ps.ProductId == p.ProductId)
                    .Select(ps => ps.Store.StoreName)
                    .ToList(),
                IsAvailable = (p.IsActive ?? false) && !(p.IsSoldOut ?? false),
                IsFeatured = false, // Not in DB
                DiscountPercent = null, // Not in DB
                ImageUrls = _context.MediaMappings
                    .Where(mm => mm.EntityType == "Product" && mm.EntityId == p.ProductId)
                    .OrderBy(mm => mm.DisplayOrder)
                    .Select(mm => mm.Media.FilePath)
                    .ToList(),
                Toppings = _context.ProductToppings
                    .Where(pt => pt.ProductId == p.ProductId)
                    .Select(pt => new ToppingDto
                    {
                        ToppingId = pt.Topping.ToppingId,
                        ToppingName = pt.Topping.ToppingName ?? string.Empty,
                        Price = pt.Topping.Price ?? 0,
                        IsAvailable = pt.Topping.IsAvailable ?? false
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateProductAsync(CreateProductDto dto, int ownerId)
    {
        // Verify store ownership
        var store = await _context.Stores.FirstOrDefaultAsync(s => s.StoreId == dto.StoreId && s.OwnerId == ownerId);
        if (store == null)
        {
            throw new UnauthorizedAccessException("Store not found or you don't have permission");
        }

        // Handle category
        int? categoryId = dto.CategoryId;
        if (!string.IsNullOrEmpty(dto.NewCategoryName))
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryName == dto.NewCategoryName);

            if (existingCategory != null)
            {
                categoryId = existingCategory.CategoryId;
            }
            else
            {
                var newCategory = new Category
                {
                    CategoryName = dto.NewCategoryName
                };
                _context.Categories.Add(newCategory);
                await _context.SaveChangesAsync();
                categoryId = newCategory.CategoryId;
            }
        }

        var product = new Product
        {
            ProductName = dto.ProductName,
            Description = dto.Description,
            BasePrice = dto.BasePrice,
            CategoryId = categoryId,
            StoreId = dto.StoreId, // Primary store for backward compatibility
            IsActive = dto.IsAvailable,
            IsSoldOut = false
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Add ProductStore entries for multi-store support
        var storeIdsToAdd = dto.StoreIds != null && dto.StoreIds.Any() ? dto.StoreIds : new List<int> { dto.StoreId };
        
        // Verify all stores belong to owner
        var ownerStoreIds = await _context.Stores
            .Where(s => s.OwnerId == ownerId)
            .Select(s => s.StoreId)
            .ToListAsync();

        foreach (var storeIdToAdd in storeIdsToAdd.Where(sid => ownerStoreIds.Contains(sid)))
        {
            _context.ProductStores.Add(new ProductStore
            {
                ProductId = product.ProductId,
                StoreId = storeIdToAdd
            });
        }

        await _context.SaveChangesAsync();
        return product.ProductId;
    }

    public async Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto, int ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.Store.OwnerId == ownerId);

        if (product == null)
        {
            return false;
        }

        // Handle category
        int? categoryId = dto.CategoryId;
        if (!string.IsNullOrEmpty(dto.NewCategoryName))
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryName == dto.NewCategoryName);

            if (existingCategory != null)
            {
                categoryId = existingCategory.CategoryId;
            }
            else
            {
                var newCategory = new Category
                {
                    CategoryName = dto.NewCategoryName
                };
                _context.Categories.Add(newCategory);
                await _context.SaveChangesAsync();
                categoryId = newCategory.CategoryId;
            }
        }

        product.ProductName = dto.ProductName;
        product.Description = dto.Description;
        product.BasePrice = dto.BasePrice;
        product.CategoryId = categoryId;
        product.IsActive = dto.IsAvailable;
        product.IsSoldOut = !dto.IsAvailable;

        // Update ProductStore entries if StoreIds provided
        if (dto.StoreIds != null && dto.StoreIds.Any())
        {
            // Verify all stores belong to owner
            var ownerStoreIds = await _context.Stores
                .Where(s => s.OwnerId == ownerId)
                .Select(s => s.StoreId)
                .ToListAsync();

            var validStoreIds = dto.StoreIds.Where(sid => ownerStoreIds.Contains(sid)).ToList();

            // Remove old ProductStore entries
            var existingProductStores = await _context.ProductStores
                .Where(ps => ps.ProductId == productId)
                .ToListAsync();
            _context.ProductStores.RemoveRange(existingProductStores);

            // Add new ProductStore entries
            foreach (var storeId in validStoreIds)
            {
                _context.ProductStores.Add(new ProductStore
                {
                    ProductId = productId,
                    StoreId = storeId
                });
            }

            // Update primary store to first in list
            if (validStoreIds.Any())
            {
                product.StoreId = validStoreIds.First();
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteProductAsync(int productId, int ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.Store.OwnerId == ownerId);

        if (product == null)
        {
            return false;
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleProductAvailableAsync(int productId, int ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.Store.OwnerId == ownerId);

        if (product == null)
        {
            return false;
        }

        var isCurrentlyAvailable = (product.IsActive ?? false) && !(product.IsSoldOut ?? false);
        product.IsActive = !isCurrentlyAvailable;
        product.IsSoldOut = isCurrentlyAvailable;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleProductFeaturedAsync(int productId, int ownerId)
    {
        // Featured not supported in current DB schema - just return true
        return true;
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        return await _context.Categories
            .Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName ?? string.Empty,
                ProductCount = _context.Products.Count(p => p.CategoryId == c.CategoryId)
            })
            .OrderBy(c => c.CategoryName)
            .ToListAsync();
    }

    public async Task<int> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.CategoryName == dto.CategoryName);

        if (existingCategory != null)
        {
            return existingCategory.CategoryId;
        }

        var category = new Category
        {
            CategoryName = dto.CategoryName
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return category.CategoryId;
    }

    public async Task<IEnumerable<ToppingDto>> GetProductToppingsAsync(int productId, int ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.Store.OwnerId == ownerId);

        if (product == null)
        {
            return new List<ToppingDto>();
        }

        return await _context.ProductToppings
            .Where(pt => pt.ProductId == productId)
            .Select(pt => new ToppingDto
            {
                ToppingId = pt.Topping.ToppingId,
                ToppingName = pt.Topping.ToppingName ?? string.Empty,
                Price = pt.Topping.Price ?? 0,
                IsAvailable = pt.Topping.IsAvailable ?? false
            })
            .ToListAsync();
    }

    public async Task<int> CreateToppingAsync(int productId, CreateToppingDto dto, int ownerId)
    {
        var product = await _context.Products
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.Store.OwnerId == ownerId);

        if (product == null)
        {
            throw new UnauthorizedAccessException("Product not found or you don't have permission");
        }

        var topping = new Topping
        {
            ToppingName = dto.ToppingName,
            Price = dto.Price,
            IsAvailable = dto.IsAvailable
        };

        _context.Toppings.Add(topping);
        await _context.SaveChangesAsync();

        var productTopping = new ProductTopping
        {
            ProductId = productId,
            ToppingId = topping.ToppingId
        };

        _context.ProductToppings.Add(productTopping);
        await _context.SaveChangesAsync();

        return topping.ToppingId;
    }

    public async Task<bool> UpdateToppingAsync(int productId, int toppingId, UpdateToppingDto dto, int ownerId)
    {
        var productTopping = await _context.ProductToppings
            .Include(pt => pt.Product.Store)
            .Include(pt => pt.Topping)
            .FirstOrDefaultAsync(pt => pt.ProductId == productId && 
                                      pt.ToppingId == toppingId && 
                                      pt.Product.Store.OwnerId == ownerId);

        if (productTopping == null)
        {
            return false;
        }

        var topping = productTopping.Topping;
        topping.ToppingName = dto.ToppingName;
        topping.Price = dto.Price;
        topping.IsAvailable = dto.IsAvailable;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteToppingAsync(int productId, int toppingId, int ownerId)
    {
        var productTopping = await _context.ProductToppings
            .Include(pt => pt.Product.Store)
            .FirstOrDefaultAsync(pt => pt.ProductId == productId && 
                                      pt.ToppingId == toppingId && 
                                      pt.Product.Store.OwnerId == ownerId);

        if (productTopping == null)
        {
            return false;
        }

        _context.ProductToppings.Remove(productTopping);
        
        var topping = await _context.Toppings.FindAsync(toppingId);
        if (topping != null)
        {
            _context.Toppings.Remove(topping);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
