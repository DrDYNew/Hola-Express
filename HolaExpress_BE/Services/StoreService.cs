#nullable disable
using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Services;

public class StoreService : IStoreService
{
    private readonly IStoreRepository _storeRepository;
    private readonly ILogger<StoreService> _logger;

    public StoreService(IStoreRepository storeRepository, ILogger<StoreService> logger)
    {
        _storeRepository = storeRepository;
        _logger = logger;
    }

    public async Task<StoreDto> GetStoreByIdAsync(int storeId)
    {
        var store = await _storeRepository.GetStoreByIdAsync(storeId);
        
        if (store == null)
        {
            return null;
        }

        return new StoreDto
        {
            StoreId = store.StoreId,
            StoreName = store.StoreName ?? "",
            Address = store.Address,
            Rating = store.Rating ?? 0,
            DeliveryTime = GetEstimatedDeliveryTime(),
            Distance = GetDistance(store.Latitude, store.Longitude),
            Tags = GetStoreTags(store.StoreId),
            DiscountPercent = GetStoreDiscount(store.StoreId),
            ImageUrl = GetStoreImageUrl(store.StoreId),
            IsOpen = store.IsOpenNow ?? false,
            MinOrder = 0
        };
    }

    public async Task<List<CategoryDto>> GetStoreCategoriesAsync(int storeId)
    {
        var categories = await _storeRepository.GetStoreCategoriesAsync(storeId);
        
        return categories.Select(c => new CategoryDto
        {
            CategoryId = c.CategoryId,
            CategoryName = c.CategoryName ?? "",
            Icon = GetCategoryIcon(c.CategoryName),
            Color = GetCategoryColor(c.CategoryName),
            ProductCount = 0
        }).ToList();
    }

    public async Task<List<ProductDto>> GetStoreProductsAsync(int storeId, int? categoryId = null)
    {
        var products = await _storeRepository.GetStoreProductsAsync(storeId, categoryId);
        var productDtos = new List<ProductDto>();

        foreach (var p in products)
        {
            var images = await _storeRepository.GetProductImagesAsync(p.ProductId);
            productDtos.Add(new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? "",
                Description = p.Description,
                ImageUrls = images.Count > 0 ? images : GetDefaultProductImages(),
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

        return productDtos;
    }

    // Helper methods
    private static string GetCategoryIcon(string categoryName)
    {
        if (categoryName == null) return "food";
        
        return categoryName.ToLower() switch
        {
            var name when name.Contains("trà") || name.Contains("tea") => "tea",
            var name when name.Contains("cà phê") || name.Contains("cafe") || name.Contains("coffee") => "coffee",
            var name when name.Contains("bánh") || name.Contains("cake") => "cake-variant",
            var name when name.Contains("smoothie") => "blender",
            var name when name.Contains("burger") || name.Contains("hamburger") => "hamburger",
            var name when name.Contains("pizza") => "pizza",
            var name when name.Contains("noodle") || name.Contains("mì") || name.Contains("phở") => "noodles",
            var name when name.Contains("rice") || name.Contains("cơm") => "rice",
            _ => "food"
        };
    }

    private static string GetCategoryColor(string categoryName)
    {
        if (categoryName == null) return "#FF6B6B";
        
        return categoryName.ToLower() switch
        {
            var name when name.Contains("trà") || name.Contains("tra") || name.Contains("tea") => "#4CAF50",
            var name when name.Contains("cà phê") || name.Contains("cafe") || name.Contains("coffee") => "#795548",
            var name when name.Contains("bánh") || name.Contains("cake") => "#FF9800",
            var name when name.Contains("smoothie") => "#E91E63",
            var name when name.Contains("burger") || name.Contains("hamburger") => "#F44336",
            var name when name.Contains("pizza") => "#FFA726",
            var name when name.Contains("noodle") || name.Contains("mì") || name.Contains("phở") => "#FFC107",
            var name when name.Contains("rice") || name.Contains("cơm") => "#8BC34A",
            _ => "#FF6B6B"
        };
    }

    private static int GetEstimatedDeliveryTime()
    {
        return new Random().Next(15, 45);
    }

    private static double GetDistance(double? lat, double? lng)
    {
        return Math.Round(new Random().NextDouble() * 5, 1);
    }

    private static List<string> GetStoreTags(int storeId)
    {
        var tags = new List<string> { "Giao nhanh" };
        if (new Random().Next(0, 2) == 1)
            tags.Add("Ưu đãi");
        return tags;
    }

    private static int? GetStoreDiscount(int storeId)
    {
        var random = new Random();
        return random.Next(0, 3) == 1 ? random.Next(10, 30) : null;
    }

    private static string GetStoreImageUrl(int storeId)
    {
        var imageUrls = new[]
        {
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
            "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
            "https://images.unsplash.com/photo-1552566626-52f8b828add9"
        };
        return imageUrls[storeId % imageUrls.Length];
    }

    private static List<string> GetDefaultProductImages()
    {
        return new List<string>
        {
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735"
        };
    }
}
