using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IStoreRepository
{
    Task<Store?> GetStoreByIdAsync(int storeId);
    Task<List<Category>> GetStoreCategoriesAsync(int storeId);
    Task<List<Product>> GetStoreProductsAsync(int storeId, int? categoryId = null);
    Task<List<string>> GetProductImagesAsync(int productId);
}
