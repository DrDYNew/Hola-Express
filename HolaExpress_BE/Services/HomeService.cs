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
                Icon = GetCategoryIcon(g.Key ?? ""),
                Color = GetCategoryColor(g.Key ?? ""),
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
                CategoryId = 10001,
                CategoryName = "Tìm xe",
                Icon = "car",
                Color = "#FF6B6B",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = 10002,
                CategoryName = "Gần bạn",
                Icon = "map-marker-radius",
                Color = "#4ECDC4",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = 10003,
                CategoryName = "Ưu đãi",
                Icon = "ticket-percent",
                Color = "#45B7D1",
                ProductCount = 0
            },
            new CategoryDto
            {
                CategoryId = 10004,
                CategoryName = "Đánh giá cao",
                Icon = "star",
                Color = "#FFA07A",
                ProductCount = 0
            }
        };

        return Task.FromResult(utilities);
    }

    public async Task<List<StoreDto>> GetStoresAsync(int page, int limit, double? userLat = null, double? userLng = null)
    {
        var stores = await _homeRepository.GetStoresAsync(page, limit);
        var categories = await _homeRepository.GetCategoriesAsync();
        
        var storeDtos = new List<StoreDto>();
        foreach (var s in stores)
        {
            var rating = await _homeRepository.GetStoreAverageRatingAsync(s.StoreId);
            var distance = GetDistance(s.Latitude, s.Longitude, userLat, userLng);
            
            storeDtos.Add(new StoreDto
            {
                StoreId = s.StoreId,
                StoreName = s.StoreName ?? "",
                Address = s.Address,
                Rating = rating,
                DeliveryTime = GetEstimatedDeliveryTime(distance),
                Distance = distance,
                Tags = GetStoreTagsFromCategories(s.StoreId, categories),
                DiscountPercent = GetStoreDiscount(s.StoreId),
                ImageUrl = GetStoreImageUrl(s.StoreId),
                IsOpen = s.IsOpenNow ?? false,
                MinOrder = 0,
                Latitude = s.Latitude,
                Longitude = s.Longitude
            });
        }
        
        return storeDtos;
    }

    public async Task<List<StoreDto>> GetNearbyStoresAsync(double? lat, double? lng)
    {
        var stores = await _homeRepository.GetNearbyStoresAsync();
        var categories = await _homeRepository.GetCategoriesAsync();
        
        var storeDtos = new List<StoreDto>();
        foreach (var s in stores)
        {
            var rating = await _homeRepository.GetStoreAverageRatingAsync(s.StoreId);
            var distance = GetDistance(s.Latitude, s.Longitude, lat, lng);
            
            storeDtos.Add(new StoreDto
            {
                StoreId = s.StoreId,
                StoreName = s.StoreName ?? "",
                Address = s.Address,
                Rating = rating,
                DeliveryTime = GetEstimatedDeliveryTime(distance),
                Distance = distance,
                Tags = GetStoreTagsFromCategories(s.StoreId, categories),
                DiscountPercent = GetStoreDiscount(s.StoreId),
                ImageUrl = GetStoreImageUrl(s.StoreId),
                IsOpen = s.IsOpenNow ?? false,
                MinOrder = 0,
                Latitude = s.Latitude,
                Longitude = s.Longitude
            });
        }
        
        return storeDtos;
    }

    public async Task<List<ProductDto>> GetProductsAsync(int? categoryId, int? storeId)
    {
        var products = await _homeRepository.GetProductsAsync(categoryId, storeId);
        if (products.Count == 0) return new List<ProductDto>();

        // Batch load all images in one query
        var productIds = products.Select(p => p.ProductId).ToList();
        var imagesByProduct = await _homeRepository.GetProductImagesBatchAsync(productIds);

        var productDtos = new List<ProductDto>();
        foreach (var p in products)
        {
            var images = imagesByProduct.ContainsKey(p.ProductId) 
                ? imagesByProduct[p.ProductId] 
                : new List<string>();

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

    public async Task<List<ProductDto>> GetFlashSaleProductsAsync()
    {
        var products = await _homeRepository.GetFlashSaleProductsAsync();
        if (products.Count == 0) return new List<ProductDto>();

        // Batch load all images in one query
        var productIds = products.Select(p => p.ProductId).ToList();
        var imagesByProduct = await _homeRepository.GetProductImagesBatchAsync(productIds);

        var productDtos = new List<ProductDto>();
        foreach (var p in products)
        {
            var images = imagesByProduct.ContainsKey(p.ProductId) 
                ? imagesByProduct[p.ProductId] 
                : new List<string>();
            var discountPercent = 30; // Có thể lấy từ database
            var discountPrice = p.BasePrice * (100 - discountPercent) / 100;
            
            productDtos.Add(new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? "",
                Description = p.Description,
                ImageUrls = images.Count > 0 ? images : GetDefaultProductImages(),
                BasePrice = p.BasePrice,
                DiscountPrice = discountPrice,
                DiscountPercent = discountPercent,
                CategoryId = p.CategoryId ?? 0,
                StoreId = p.StoreId ?? 0,
                StoreName = p.Store != null ? (p.Store.StoreName ?? "") : "",
                StoreRating = p.Store != null ? (p.Store.Rating ?? 0) : 0,
                IsActive = p.IsActive ?? false,
                IsSoldOut = p.IsSoldOut ?? false,
                OriginalPrice = p.BasePrice,
                SoldCount = new Random().Next(20, 100), // Mock - nên có trong DB
                TotalStock = 100
            });
        }

        return productDtos;
    }

    public async Task<List<ProductDto>> GetRecommendedProductsAsync()
    {
        var products = await _homeRepository.GetRecommendedProductsAsync();
        if (products.Count == 0) return new List<ProductDto>();

        // Batch load all images in one query
        var productIds = products.Select(p => p.ProductId).ToList();
        var imagesByProduct = await _homeRepository.GetProductImagesBatchAsync(productIds);

        var productDtos = new List<ProductDto>();
        foreach (var p in products)
        {
            var images = imagesByProduct.ContainsKey(p.ProductId) 
                ? imagesByProduct[p.ProductId] 
                : new List<string>();

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

    public async Task<List<BannerDto>> GetBannersAsync()
    {
        var banners = await _homeRepository.GetActiveBannersAsync();
        
        return banners.Select(b => new BannerDto
        {
            BannerId = b.BannerId,
            ImageUrl = b.ImageUrl ?? "",
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

    private static int GetEstimatedDeliveryTime(double? distance)
    {
        if (!distance.HasValue || distance.Value == 0)
            return 30; // Default 30 phút nếu không có khoảng cách

        // Tính toán thời gian dựa trên khoảng cách:
        // - Dưới 2km: 15-20 phút
        // - 2-5km: 20-30 phút  
        // - 5-10km: 30-45 phút
        // - Trên 10km: 45-60 phút
        var baseTime = distance.Value switch
        {
            < 2 => 15,
            < 5 => 20,
            < 10 => 30,
            _ => 45
        };

        // Thêm thời gian chuẩn bị (5-10 phút) và thời gian di chuyển
        var travelTime = (int)Math.Ceiling(distance.Value * 3); // Giả sử 20km/h trung bình
        return baseTime + travelTime;
    }

    private static double? GetDistance(double? storeLat, double? storeLng, double? userLat = null, double? userLng = null)
    {
        // Nếu không có GPS của user hoặc store, return null
        if (!storeLat.HasValue || !storeLng.HasValue || !userLat.HasValue || !userLng.HasValue)
        {
            return null;
        }

        // Haversine formula - tính khoảng cách thực giữa 2 điểm GPS
        const double R = 6371; // Radius of Earth in kilometers
        var dLat = ToRadians(userLat.Value - storeLat.Value);
        var dLon = ToRadians(userLng.Value - storeLng.Value);
        
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(storeLat.Value)) * Math.Cos(ToRadians(userLat.Value)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        var distance = R * c;
        
        return Math.Round(distance, 1);
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }

    private static List<string> GetStoreTagsFromCategories(int storeId, List<Category> categories)
    {
        var storeTags = categories
            .Where(c => c.StoreId == storeId)
            .Select(c => c.CategoryName ?? "")
            .Distinct()
            .Take(3)
            .ToList();
        
        if (!storeTags.Any())
            storeTags.Add("Món ăn");
            
        return storeTags;
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
