using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.Models;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.DTOs.Cart;

namespace HolaExpress_BE.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly HolaExpressContext _context;

        public CartRepository(HolaExpressContext context)
        {
            _context = context;
        }

        public async Task<int?> GetCartIdByUserIdAsync(int userId)
        {
            var cart = await _context.Carts
                .Where(c => c.UserId == userId)
                .Select(c => c.CartId)
                .FirstOrDefaultAsync();

            return cart == 0 ? null : cart;
        }

        public async Task<int> CreateCartAsync(int userId, int storeId)
        {
            var cart = new Cart
            {
                UserId = userId,
                StoreId = storeId,
                UpdatedAt = DateTime.Now
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return cart.CartId;
        }

        public async Task<int?> GetCartStoreIdAsync(int cartId)
        {
            return await _context.Carts
                .Where(c => c.CartId == cartId)
                .Select(c => c.StoreId)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateCartStoreAsync(int cartId, int storeId)
        {
            var cart = await _context.Carts.FindAsync(cartId);
            if (cart != null)
            {
                cart.StoreId = storeId;
                cart.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int?> GetExistingCartItemIdAsync(int cartId, int productId, int? variantId)
        {
            var item = await _context.CartItems
                .Where(ci => ci.CartId == cartId && 
                            ci.ProductId == productId && 
                            ci.VariantId == variantId)
                .Select(ci => ci.ItemId)
                .FirstOrDefaultAsync();

            return item == 0 ? null : item;
        }

        public async Task<bool> AddCartItemAsync(int cartId, int productId, int? variantId, int quantity, string? note, List<int>? toppingIds = null)
        {
            var cartItem = new CartItem
            {
                CartId = cartId,
                ProductId = productId,
                VariantId = variantId,
                Quantity = quantity,
                Note = note
            };

            _context.CartItems.Add(cartItem);
            await _context.SaveChangesAsync();

            // Add toppings if provided
            if (toppingIds != null && toppingIds.Count > 0)
            {
                foreach (var toppingId in toppingIds)
                {
                    var cartItemTopping = new CartItemTopping
                    {
                        CartItemId = cartItem.ItemId,
                        ToppingId = toppingId
                    };
                    _context.CartItemToppings.Add(cartItemTopping);
                }
            }
            
            // Update cart timestamp
            var cart = await _context.Carts.FindAsync(cartId);
            if (cart != null)
            {
                cart.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCartItemQuantityAsync(int itemId, int quantity)
        {
            var item = await _context.CartItems.FindAsync(itemId);
            if (item == null) return false;

            item.Quantity = quantity;
            
            // Update cart timestamp
            var cart = await _context.Carts.FindAsync(item.CartId);
            if (cart != null)
            {
                cart.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CartResponseDto?> GetCartByUserIdAsync(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Store)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Variant)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.CartItemToppings)
                        .ThenInclude(cit => cit.Topping)
                .Where(c => c.UserId == userId)
                .FirstOrDefaultAsync();

            if (cart == null) return null;

            var items = new List<CartItemDto>();
            decimal subTotal = 0;

            foreach (var cartItem in cart.CartItems)
            {
                var product = cartItem.Product;
                var variant = cartItem.Variant;

                // Get primary image from MediaMappings table
                var primaryImage = await _context.MediaMappings
                    .Where(mm => mm.EntityType == "Product" && 
                                 mm.EntityId == product.ProductId && 
                                 mm.MediaType == "primary")
                    .OrderBy(mm => mm.DisplayOrder)
                    .Select(mm => mm.Media.FilePath)
                    .FirstOrDefaultAsync();

                decimal basePrice = product.BasePrice;
                decimal variantAdjustment = variant?.PriceAdjustment ?? 0;
                
                // Get toppings and calculate topping price
                var toppings = new List<ToppingInCartDto>();
                decimal toppingPrice = 0;
                
                foreach (var cartItemTopping in cartItem.CartItemToppings)
                {
                    if (cartItemTopping.Topping != null)
                    {
                        toppings.Add(new ToppingInCartDto
                        {
                            ToppingId = cartItemTopping.Topping.ToppingId,
                            ToppingName = cartItemTopping.Topping.ToppingName ?? "",
                            Price = cartItemTopping.Topping.Price ?? 0
                        });
                        toppingPrice += cartItemTopping.Topping.Price ?? 0;
                    }
                }
                
                decimal itemPrice = (basePrice + variantAdjustment + toppingPrice) * (cartItem.Quantity ?? 1);

                var item = new CartItemDto
                {
                    ItemId = cartItem.ItemId,
                    ProductId = product?.ProductId ?? 0,
                    ProductName = product?.ProductName ?? "",
                    ImageUrl = primaryImage,
                    BasePrice = basePrice,
                    VariantId = variant?.VariantId,
                    VariantName = variant?.VariantName,
                    VariantPriceAdjustment = variantAdjustment,
                    Quantity = cartItem.Quantity ?? 1,
                    Note = cartItem.Note,
                    Toppings = toppings,
                    TotalPrice = itemPrice
                };

                items.Add(item);
                subTotal += itemPrice;
            }

            return new CartResponseDto
            {
                CartId = cart.CartId,
                StoreId = cart.StoreId ?? 0,
                StoreName = cart.Store?.StoreName ?? "",
                Items = items,
                SubTotal = subTotal,
                TotalItems = items.Sum(i => i.Quantity)
            };
        }

        public async Task<bool> ClearCartAsync(int cartId)
        {
            var items = await _context.CartItems
                .Where(ci => ci.CartId == cartId)
                .ToListAsync();

            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveCartItemAsync(int itemId)
        {
            var item = await _context.CartItems.FindAsync(itemId);
            if (item == null) return false;

            _context.CartItems.Remove(item);
            
            // Update cart timestamp
            var cart = await _context.Carts.FindAsync(item.CartId);
            if (cart != null)
            {
                cart.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddCartItemToppingsAsync(int itemId, List<int> toppingIds)
        {
            // Note: This would require a CartItemToppings junction table
            // which doesn't exist in the current schema
            // For now, returning true as placeholder
            await Task.CompletedTask;
            return true;
        }

        public async Task<bool> RemoveCartItemToppingsAsync(int itemId)
        {
            // Note: This would require a CartItemToppings junction table
            // For now, returning true as placeholder
            await Task.CompletedTask;
            return true;
        }
    }
}
