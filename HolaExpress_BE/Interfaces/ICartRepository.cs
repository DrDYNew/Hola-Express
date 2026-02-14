using HolaExpress_BE.DTOs.Cart;

namespace HolaExpress_BE.Interfaces
{
    public interface ICartRepository
    {
        Task<int?> GetCartIdByUserIdAsync(int userId);
        Task<int> CreateCartAsync(int userId, int storeId);
        Task<int?> GetCartStoreIdAsync(int cartId);
        Task UpdateCartStoreAsync(int cartId, int storeId);
        Task<bool> AddCartItemAsync(int cartId, int productId, int? variantId, int quantity, string? note, List<int>? toppingIds = null);
        Task<bool> UpdateCartItemQuantityAsync(int itemId, int quantity);
        Task<int?> GetExistingCartItemIdAsync(int cartId, int productId, int? variantId);
        Task<CartResponseDto?> GetCartByUserIdAsync(int userId);
        Task<bool> ClearCartAsync(int cartId);
        Task<bool> RemoveCartItemAsync(int itemId);
        Task<bool> AddCartItemToppingsAsync(int itemId, List<int> toppingIds);
        Task<bool> RemoveCartItemToppingsAsync(int itemId);
    }
}
