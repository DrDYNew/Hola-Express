using HolaExpress_BE.DTOs.Home;

namespace HolaExpress_BE.Interfaces;

public interface IProductService
{
    Task<ProductDetailDto?> GetProductDetailAsync(int productId);
    Task<List<ProductDto>> GetSimilarProductsAsync(int productId);
}
