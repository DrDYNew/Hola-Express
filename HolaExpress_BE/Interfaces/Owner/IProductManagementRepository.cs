using HolaExpress_BE.DTOs.Owner;

namespace HolaExpress_BE.Interfaces.Owner;

public interface IProductManagementRepository
{
    // Product CRUD
    Task<IEnumerable<ProductDto>> GetOwnerProductsAsync(int ownerId, int? storeId = null);
    Task<ProductDto?> GetProductByIdAsync(int productId, int ownerId);
    Task<int> CreateProductAsync(CreateProductDto dto, int ownerId);
    Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto, int ownerId);
    Task<bool> DeleteProductAsync(int productId, int ownerId);
    Task<bool> ToggleProductAvailableAsync(int productId, int ownerId);
    Task<bool> ToggleProductFeaturedAsync(int productId, int ownerId);

    // Category Management
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<int> CreateCategoryAsync(CreateCategoryDto dto);

    // Topping Management
    Task<IEnumerable<ToppingDto>> GetProductToppingsAsync(int productId, int ownerId);
    Task<int> CreateToppingAsync(int productId, CreateToppingDto dto, int ownerId);
    Task<bool> UpdateToppingAsync(int productId, int toppingId, UpdateToppingDto dto, int ownerId);
    Task<bool> DeleteToppingAsync(int productId, int toppingId, int ownerId);
}
