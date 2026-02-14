using HolaExpress_BE.DTOs.Home;

namespace HolaExpress_BE.Interfaces;

public interface IStoreService
{
    Task<StoreDto?> GetStoreByIdAsync(int storeId);
    Task<List<CategoryDto>> GetStoreCategoriesAsync(int storeId);
    Task<List<ProductDto>> GetStoreProductsAsync(int storeId, int? categoryId = null);
}
