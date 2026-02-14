#nullable disable
using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task<ProductDetailDto?> GetProductDetailAsync(int productId)
    {
        var product = await _productRepository.GetProductByIdAsync(productId);
        
        if (product == null)
        {
            return null;
        }

        var variants = await _productRepository.GetProductVariantsAsync(productId);
        var toppings = await _productRepository.GetProductToppingsAsync(productId);
        var images = await _productRepository.GetProductImagesAsync(productId);

        return new ProductDetailDto
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName ?? "",
            Description = product.Description,
            ImageUrls = images.Any() ? images : GetDefaultProductImages(),
            BasePrice = product.BasePrice,
            DiscountPrice = null,
            DiscountPercent = null,
            CategoryId = product.CategoryId ?? 0,
            StoreId = product.StoreId ?? 0,
            StoreName = product.Store != null ? (product.Store.StoreName ?? "") : "",
            StoreRating = product.Store != null ? (product.Store.Rating ?? 0) : 0,
            IsActive = product.IsActive ?? false,
            IsSoldOut = product.IsSoldOut ?? false,
            Variants = variants.Select(v => new VariantDto
            {
                VariantId = v.VariantId,
                VariantName = v.VariantName ?? "",
                PriceAdjustment = v.PriceAdjustment ?? 0
            }).ToList(),
            AvailableToppings = toppings.Select(t => new ToppingDto
            {
                ToppingId = t.ToppingId,
                ToppingName = t.ToppingName ?? "",
                Price = t.Price ?? 0,
                IsAvailable = t.IsAvailable ?? true
            }).ToList()
        };
    }

    public async Task<List<ProductDto>> GetSimilarProductsAsync(int productId)
    {
        var product = await _productRepository.GetProductByIdAsync(productId);
        
        if (product == null || !product.CategoryId.HasValue)
        {
            return new List<ProductDto>();
        }

        var similarProducts = await _productRepository.GetSimilarProductsAsync(
            productId, 
            product.CategoryId.Value, 
            10
        );

        var result = new List<ProductDto>();
        foreach (var p in similarProducts)
        {
            var images = await _productRepository.GetProductImagesAsync(p.ProductId);
            result.Add(new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? "",
                Description = p.Description,
                ImageUrls = images.Any() ? images : GetDefaultProductImages(),
                BasePrice = p.BasePrice,
                DiscountPrice = null,
                DiscountPercent = null,
                CategoryId = p.CategoryId ?? 0,
                StoreId = p.StoreId ?? 0,
                StoreName = p.Store != null ? (p.Store.StoreName ?? "") : "",
                StoreRating = p.Store != null ? (p.Store.Rating ?? 0) : 0,
                IsActive = p.IsActive ?? false,
                IsSoldOut = p.IsSoldOut ?? false
            });
        }

        return result;
    }

    private static List<string> GetDefaultProductImages()
    {
        return new List<string>
        {
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735"
        };
    }

    private static string GetProductImageUrl(int productId)
    {
        var imageUrls = new[]
        {
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
            "https://images.unsplash.com/photo-1497534547324-0ebb3f052e88",
            "https://images.unsplash.com/photo-1556679343-c7306c1976bc"
        };
        return imageUrls[productId % imageUrls.Length];
    }
}
