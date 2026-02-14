using HolaExpress_BE.DTOs.Cart;

namespace HolaExpress_BE.Interfaces
{
    public interface ICartService
    {
        Task<CartResponseDto> AddToCartAsync(int userId, AddToCartDto request);
        Task<CartResponseDto?> GetCartAsync(int userId);
        Task<bool> RemoveFromCartAsync(int userId, int itemId);
        Task<bool> UpdateCartItemQuantityAsync(int userId, int itemId, int quantity);
        Task<bool> ClearCartAsync(int userId);
    }}