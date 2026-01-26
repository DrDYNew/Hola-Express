#nullable disable
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api")]
public class HomeController : ControllerBase
{
    private readonly IHomeService _homeService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(IHomeService homeService, ILogger<HomeController> logger)
    {
        _homeService = homeService;
        _logger = logger;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        try
        {
            var categories = await _homeService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("utilities")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetUtilities()
    {
        try
        {
            var utilities = await _homeService.GetUtilitiesAsync();
            return Ok(utilities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting utilities");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("stores")]
    public async Task<ActionResult<IEnumerable<StoreDto>>> GetStores([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            var stores = await _homeService.GetStoresAsync(page, limit);
            return Ok(stores);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stores");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("stores/nearby")]
    public async Task<ActionResult<IEnumerable<StoreDto>>> GetNearbyStores([FromQuery] double? lat, [FromQuery] double? lng)
    {
        try
        {
            var stores = await _homeService.GetNearbyStoresAsync(lat, lng);
            return Ok(stores);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby stores");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] int? categoryId, [FromQuery] int? storeId)
    {
        try
        {
            var products = await _homeService.GetProductsAsync(categoryId, storeId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("products/flash-sale")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetFlashSaleProducts()
    {
        try
        {
            var products = await _homeService.GetFlashSaleProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flash sale products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("products/recommended")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetRecommendedProducts()
    {
        try
        {
            var products = await _homeService.GetRecommendedProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommended products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("banners")]
    public async Task<ActionResult<IEnumerable<BannerDto>>> GetBanners()
    {
        try
        {
            var banners = await _homeService.GetBannersAsync();
            return Ok(banners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting banners");
            return StatusCode(500, "Internal server error");
        }
    }
}
