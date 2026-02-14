using HolaExpress_BE.DTOs.Home;

namespace HolaExpress_BE.Interfaces;

public interface IHomeService
{
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<List<CategoryDto>> GetUtilitiesAsync();
    Task<List<StoreDto>> GetStoresAsync(int page, int limit, double? userLat = null, double? userLng = null);
    Task<List<StoreDto>> GetNearbyStoresAsync(double? lat, double? lng);
    Task<List<ProductDto>> GetProductsAsync(int? categoryId, int? storeId);
    Task<List<ProductDto>> GetFlashSaleProductsAsync();
    Task<List<ProductDto>> GetRecommendedProductsAsync();
    Task<List<BannerDto>> GetBannersAsync();
}
