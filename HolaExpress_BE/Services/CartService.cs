using HolaExpress_BE.Interfaces;
using HolaExpress_BE.DTOs.Cart;

namespace HolaExpress_BE.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;

        public CartService(ICartRepository cartRepository, IProductRepository productRepository)
        {
            _cartRepository = cartRepository;
            _productRepository = productRepository;
        }

        public async Task<CartResponseDto> AddToCartAsync(int userId, AddToCartDto request)
        {
            // Validate product exists
            var product = await _productRepository.GetProductByIdAsync(request.ProductId);
            if (product == null)
            {
                throw new ArgumentException("Sản phẩm không tồn tại");
            }

            // Check if product is active and not sold out
            if (product.IsActive != true || product.IsSoldOut == true)
            {
                throw new InvalidOperationException("Sản phẩm hiện không khả dụng");
            }

            // Get or create cart for user
            var cartId = await _cartRepository.GetCartIdByUserIdAsync(userId);
            
            if (cartId == null)
            {
                // Create new cart
                cartId = await _cartRepository.CreateCartAsync(userId, product.StoreId ?? 0);
            }
            else
            {
                // Check if cart belongs to same store
                var currentStoreId = await _cartRepository.GetCartStoreIdAsync(cartId.Value);
                
                if (currentStoreId != product.StoreId)
                {
                    // Clear cart and update store
                    await _cartRepository.ClearCartAsync(cartId.Value);
                    await _cartRepository.UpdateCartStoreAsync(cartId.Value, product.StoreId ?? 0);
                }
            }

            // Always add as new item (even if same product+variant)
            // Each cart item can have different toppings, so we treat them as separate items
            await _cartRepository.AddCartItemAsync(
                cartId.Value,
                request.ProductId,
                request.VariantId,
                request.Quantity,
                request.Note,
                request.ToppingIds
            );

            // Return updated cart
            var updatedCart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (updatedCart == null)
            {
                throw new InvalidOperationException("Không thể lấy thông tin giỏ hàng");
            }

            return updatedCart;
        }

        public async Task<CartResponseDto?> GetCartAsync(int userId)
        {
            return await _cartRepository.GetCartByUserIdAsync(userId);
        }

        public async Task<bool> RemoveFromCartAsync(int userId, int itemId)
        {
            // Verify cart belongs to user
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null || !cart.Items.Any(i => i.ItemId == itemId))
            {
                throw new UnauthorizedAccessException("Không có quyền xóa sản phẩm này");
            }

            return await _cartRepository.RemoveCartItemAsync(itemId);
        }

        public async Task<bool> UpdateCartItemQuantityAsync(int userId, int itemId, int quantity)
        {
            if (quantity < 1)
            {
                throw new ArgumentException("Số lượng phải lớn hơn 0");
            }

            // Verify cart belongs to user
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null || !cart.Items.Any(i => i.ItemId == itemId))
            {
                throw new UnauthorizedAccessException("Không có quyền cập nhật sản phẩm này");
            }

            return await _cartRepository.UpdateCartItemQuantityAsync(itemId, quantity);
        }

        public async Task<bool> ClearCartAsync(int userId)
        {
            var cartId = await _cartRepository.GetCartIdByUserIdAsync(userId);
            if (cartId == null) return false;

            return await _cartRepository.ClearCartAsync(cartId.Value);
        }
    }
}
