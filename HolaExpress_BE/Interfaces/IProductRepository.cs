using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetProductByIdAsync(int productId);
    Task<List<ProductVariant>> GetProductVariantsAsync(int productId);
    Task<List<Topping>> GetProductToppingsAsync(int productId);
    Task<List<string>> GetProductImagesAsync(int productId);
    Task<List<Product>> GetSimilarProductsAsync(int productId, int categoryId, int limit = 10);
}
