using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IHomeRepository
{
    Task<List<Category>> GetCategoriesAsync();
    Task<List<Store>> GetStoresAsync(int page, int limit);
    Task<List<Store>> GetNearbyStoresAsync();
    Task<List<Product>> GetProductsAsync(int? categoryId, int? storeId);
    Task<List<Product>> GetFlashSaleProductsAsync();
    Task<List<Product>> GetRecommendedProductsAsync();
    Task<List<Banner>> GetActiveBannersAsync();
}
