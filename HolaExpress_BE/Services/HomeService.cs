using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Services;

public class HomeService : IHomeService
{
    private readonly IHomeRepository _homeRepository;
    private readonly ILogger<HomeService> _logger;

    public HomeService(IHomeRepository homeRepository, ILogger<HomeService> logger)
    {
        _homeRepository = homeRepository;
        _logger = logger;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _homeRepository.GetCategoriesAsync();
        
        return categories
            .GroupBy(c => c.CategoryName)
            .Select(g => new CategoryDto
            {
                CategoryId = g.First().CategoryId,
                CategoryName = g.Key ?? "",
                Icon = GetCategoryIcon(g.Key),
                Color = GetCategoryColor(g.Key),
                ProductCount = g.Count()
            })
            .OrderByDescending(c => categories.FirstOrDefault(x => x.CategoryName == c.CategoryName)?.Priority ?? 0)
            .Take(4) // Chỉ lấy 4 categories có priority cao nhất
            .ToList();
    }

    public Task<List<CategoryDto>> GetUtilitiesAsync()
    {
        var utilities = new List<CategoryDto>
        {
            new CategoryDto
            {
                CategoryId = -1,
                CategoryName = "Giao nhanh",
                Icon = "lightning-bolt",
                Color = "#FF6B6B",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = -2,
                CategoryName = "Gần bạn",
                Icon = "map-marker-radius",
                Color = "#4ECDC4",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = -3,
                CategoryName = "Ưu đãi",
                Icon = "ticket-percent",
                Color = "#45B7D1",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = -4,
                CategoryName = "Đánh giá cao",
                Icon = "star",
                Color = "#FFA07A",
                ProductCount = 0
            }
        };

        return Task.FromResult(utilities);
    }

    public async Task<List<StoreDto>> GetStoresAsync(int page, int limit)
    {
        var stores = await _homeRepository.GetStoresAsync(page, limit);
        
        return stores.Select(s => new StoreDto
        {
            StoreId = s.StoreId,
            StoreName = s.StoreName ?? "",
            Address = s.Address,
            Rating = s.Rating ?? 0,
            DeliveryTime = GetEstimatedDeliveryTime(),
            Distance = GetDistance(s.Latitude, s.Longitude),
            Tags = GetStoreTags(s.StoreId),
            DiscountPercent = GetStoreDiscount(s.StoreId),
            ImageUrl = GetStoreImageUrl(s.StoreId),
            IsOpen = s.IsOpenNow ?? false,
            MinOrder = 0
        }).ToList();
    }

    public async Task<List<StoreDto>> GetNearbyStoresAsync(double? lat, double? lng)
    {
        var stores = await _homeRepository.GetNearbyStoresAsync();
        
        return stores.Select(s => new StoreDto
        {
            StoreId = s.StoreId,
            StoreName = s.StoreName ?? "",
            Address = s.Address,
            Rating = s.Rating ?? 0,
            DeliveryTime = GetEstimatedDeliveryTime(),
            Distance = GetDistance(s.Latitude, s.Longitude),
            Tags = GetStoreTags(s.StoreId),
            DiscountPercent = GetStoreDiscount(s.StoreId),
            ImageUrl = GetStoreImageUrl(s.StoreId),
            IsOpen = s.IsOpenNow ?? false,
            MinOrder = 0
        }).ToList();
    }

    public async Task<List<ProductDto>> GetProductsAsync(int? categoryId, int? storeId)
    {
        var products = await _homeRepository.GetProductsAsync(categoryId, storeId);
        
        return products.Select(p => new ProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName ?? "",
            Description = p.Description,
            ImageUrl = p.ImageUrl ?? GetProductImageUrl(p.ProductId),
            BasePrice = p.BasePrice,
            DiscountPrice = null,
            DiscountPercent = null,
            CategoryId = p.CategoryId ?? 0,
            StoreId = p.StoreId ?? 0,
            StoreName = p.Store != null ? (p.Store.StoreName ?? "") : "",
            StoreRating = p.Store != null ? (p.Store.Rating ?? 0) : 0,
            IsActive = p.IsActive ?? false,
            IsSoldOut = p.IsSoldOut ?? false
        }).ToList();
    }

    public async Task<List<ProductDto>> GetFlashSaleProductsAsync()
    {
        var products = await _homeRepository.GetFlashSaleProductsAsync();
        
        return products.Select(p => new ProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName ?? "",
            Description = p.Description,
            ImageUrl = p.ImageUrl ?? GetProductImageUrl(p.ProductId),
            BasePrice = p.BasePrice,
            DiscountPrice = p.BasePrice * 0.7m,
            DiscountPercent = 30,
            CategoryId = p.CategoryId ?? 0,
            StoreId = p.StoreId ?? 0,
            StoreName = p.Store != null ? (p.Store.StoreName ?? "") : "",
            StoreRating = p.Store != null ? (p.Store.Rating ?? 0) : 0,
            IsActive = p.IsActive ?? false,
            IsSoldOut = p.IsSoldOut ?? false
        }).ToList();
    }

    public async Task<List<ProductDto>> GetRecommendedProductsAsync()
    {
        var products = await _homeRepository.GetRecommendedProductsAsync();
        
        return products.Select(p => new ProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName ?? "",
            Description = p.Description,
            ImageUrl = p.ImageUrl ?? GetProductImageUrl(p.ProductId),
            BasePrice = p.BasePrice,
            DiscountPrice = null,
            DiscountPercent = null,
            CategoryId = p.CategoryId ?? 0,
            StoreId = p.StoreId ?? 0,
            StoreName = p.Store != null ? (p.Store.StoreName ?? "") : "",
            StoreRating = p.Store != null ? (p.Store.Rating ?? 0) : 0,
            IsActive = p.IsActive ?? false,
            IsSoldOut = p.IsSoldOut ?? false
        }).ToList();
    }

    public async Task<List<BannerDto>> GetBannersAsync()
    {
        var banners = await _homeRepository.GetActiveBannersAsync();
        
        return banners.Select(b => new BannerDto
        {
            BannerId = b.BannerId,
            ImageUrl = b.ImageUrl,
            Title = b.Title,
            Link = b.Link,
            IsActive = b.IsActive ?? false
        }).ToList();
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
