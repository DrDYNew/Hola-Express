#nullable disable
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/stores")]
public class StoreController : ControllerBase
{
    private readonly IStoreService _storeService;
    private readonly ILogger<StoreController> _logger;

    public StoreController(IStoreService storeService, ILogger<StoreController> logger)
    {
        _storeService = storeService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StoreDto>> GetStoreById(int id)
    {
        try
        {
            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null)
            {
                return NotFound($"Store with ID {id} not found");
            }
            return Ok(store);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store by ID {StoreId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/categories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetStoreCategories(int id)
    {
        try
        {
            var categories = await _storeService.GetStoreCategoriesAsync(id);
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store categories for store {StoreId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/products")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetStoreProducts(int id, [FromQuery] int? categoryId)
    {
        try
        {
            var products = await _storeService.GetStoreProductsAsync(id, categoryId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store products for store {StoreId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
