using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.DTOs.Owner;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Owner;

[ApiController]
[Route("api/owner/products")]
[Authorize]
public class ProductManagementController : ControllerBase
{
    private readonly IProductManagementService _service;
    private readonly ILogger<ProductManagementController> _logger;

    public ProductManagementController(
        IProductManagementService service,
        ILogger<ProductManagementController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private int GetOwnerId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // GET: api/owner/products?storeId=1
    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] int? storeId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var products = await _service.GetOwnerProductsAsync(ownerId, storeId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new { message = "Error retrieving products" });
        }
    }

    // GET: api/owner/products/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var product = await _service.GetProductByIdAsync(id, ownerId);
            
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product");
            return StatusCode(500, new { message = "Error retrieving product" });
        }
    }

    // POST: api/owner/products
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var productId = await _service.CreateProductAsync(dto, ownerId);
            var product = await _service.GetProductByIdAsync(productId, ownerId);
            
            return CreatedAtAction(nameof(GetProduct), new { id = productId }, product);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { message = "Error creating product" });
        }
    }

    // PUT: api/owner/products/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.UpdateProductAsync(id, dto, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            var product = await _service.GetProductByIdAsync(id, ownerId);
            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product");
            return StatusCode(500, new { message = "Error updating product" });
        }
    }

    // DELETE: api/owner/products/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.DeleteProductAsync(id, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product");
            return StatusCode(500, new { message = "Error deleting product" });
        }
    }

    // PATCH: api/owner/products/5/toggle-available
    [HttpPatch("{id}/toggle-available")]
    public async Task<IActionResult> ToggleAvailable(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.ToggleProductAvailableAsync(id, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(new { message = "Product availability toggled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling product availability");
            return StatusCode(500, new { message = "Error toggling product availability" });
        }
    }

    // PATCH: api/owner/products/5/toggle-featured
    [HttpPatch("{id}/toggle-featured")]
    public async Task<IActionResult> ToggleFeatured(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.ToggleProductFeaturedAsync(id, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(new { message = "Product featured status toggled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling product featured status");
            return StatusCode(500, new { message = "Error toggling product featured status" });
        }
    }

    // POST: api/owner/products/5/images
    [HttpPost("{id}/images")]
    public async Task<IActionResult> UploadImages(int id, [FromForm] List<IFormFile> images)
    {
        try
        {
            if (images == null || images.Count == 0)
            {
                return BadRequest(new { message = "No images provided" });
            }

            var ownerId = GetOwnerId();
            var uploadedUrls = await _service.UploadProductImagesAsync(id, images, ownerId);
            
            return Ok(new { message = "Images uploaded successfully", imageUrls = uploadedUrls });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading product images");
            return StatusCode(500, new { message = "Error uploading images" });
        }
    }

    // DELETE: api/owner/products/5/images/10
    [HttpDelete("{productId}/images/{mediaId}")]
    public async Task<IActionResult> DeleteImage(int productId, int mediaId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.DeleteProductImageAsync(productId, mediaId, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Image not found" });
            }

            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product image");
            return StatusCode(500, new { message = "Error deleting image" });
        }
    }

    // GET: api/owner/products/categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var categories = await _service.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new { message = "Error retrieving categories" });
        }
    }

    // POST: api/owner/products/categories
    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        try
        {
            var categoryId = await _service.CreateCategoryAsync(dto);
            return Ok(new { categoryId, message = "Category created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new { message = "Error creating category" });
        }
    }

    // GET: api/owner/products/5/toppings
    [HttpGet("{id}/toppings")]
    public async Task<IActionResult> GetToppings(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var toppings = await _service.GetProductToppingsAsync(id, ownerId);
            return Ok(toppings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving toppings");
            return StatusCode(500, new { message = "Error retrieving toppings" });
        }
    }

    // POST: api/owner/products/5/toppings
    [HttpPost("{id}/toppings")]
    public async Task<IActionResult> CreateTopping(int id, [FromBody] CreateToppingDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var toppingId = await _service.CreateToppingAsync(id, dto, ownerId);
            return Ok(new { toppingId, message = "Topping created successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating topping");
            return StatusCode(500, new { message = "Error creating topping" });
        }
    }

    // PUT: api/owner/products/5/toppings/10
    [HttpPut("{productId}/toppings/{toppingId}")]
    public async Task<IActionResult> UpdateTopping(int productId, int toppingId, [FromBody] UpdateToppingDto dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.UpdateToppingAsync(productId, toppingId, dto, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Topping not found" });
            }

            return Ok(new { message = "Topping updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating topping");
            return StatusCode(500, new { message = "Error updating topping" });
        }
    }

    // DELETE: api/owner/products/5/toppings/10
    [HttpDelete("{productId}/toppings/{toppingId}")]
    public async Task<IActionResult> DeleteTopping(int productId, int toppingId)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.DeleteToppingAsync(productId, toppingId, ownerId);
            
            if (!result)
            {
                return NotFound(new { message = "Topping not found" });
            }

            return Ok(new { message = "Topping deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting topping");
            return StatusCode(500, new { message = "Error deleting topping" });
        }
    }
}
