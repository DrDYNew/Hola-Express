using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Cart;
using HolaExpress_BE.Interfaces;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(ICartService cartService, ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Không thể xác định người dùng");
            }
            return userId;
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng (Yêu cầu đăng nhập)
        /// </summary>
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var userId = GetUserId();
                var cart = await _cartService.AddToCartAsync(userId, request);

                return Ok(new
                {
                    success = true,
                    message = "Đã thêm vào giỏ hàng",
                    data = cart
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Invalid product: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Invalid operation: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Unauthorized: {Message}", ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding to cart");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi thêm vào giỏ hàng"
                });
            }
        }

        /// <summary>
        /// Lấy giỏ hàng hiện tại của user (Yêu cầu đăng nhập)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.GetCartAsync(userId);

                if (cart == null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Giỏ hàng trống",
                        data = new CartResponseDto
                        {
                            Items = new List<CartItemDto>(),
                            SubTotal = 0,
                            TotalItems = 0
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Lấy giỏ hàng thành công",
                    data = cart
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Unauthorized: {Message}", ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy giỏ hàng"
                });
            }
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng (Yêu cầu đăng nhập)
        /// </summary>
        [HttpDelete("item/{itemId}")]
        public async Task<IActionResult> RemoveFromCart(int itemId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _cartService.RemoveFromCartAsync(userId, itemId);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy sản phẩm trong giỏ hàng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa sản phẩm khỏi giỏ hàng"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Unauthorized: {Message}", ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing from cart");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xóa sản phẩm"
                });
            }
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong giỏ hàng (Yêu cầu đăng nhập)
        /// </summary>
        [HttpPatch("item/{itemId}/quantity")]
        public async Task<IActionResult> UpdateQuantity(int itemId, [FromBody] UpdateQuantityDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ"
                    });
                }

                var userId = GetUserId();
                var result = await _cartService.UpdateCartItemQuantityAsync(userId, itemId, request.Quantity);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy sản phẩm trong giỏ hàng"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã cập nhật số lượng"
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Invalid quantity: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Unauthorized: {Message}", ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quantity");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi cập nhật số lượng"
                });
            }
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng (Yêu cầu đăng nhập)
        /// </summary>
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = GetUserId();
                await _cartService.ClearCartAsync(userId);

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa toàn bộ giỏ hàng"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Unauthorized: {Message}", ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cart");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xóa giỏ hàng"
                });
            }
        }
    }

    public class UpdateQuantityDto
    {
        public int Quantity { get; set; }
    }
}
