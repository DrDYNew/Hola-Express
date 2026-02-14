#nullable disable
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Home;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/products")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductController> _logger;

    public ProductController(IProductService productService, ILogger<ProductController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDetailDto>> GetProductById(int id)
    {
        try
        {
            var product = await _productService.GetProductDetailAsync(id);
            if (product == null)
            {
                return NotFound($"Product with ID {id} not found");
            }
            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product by ID {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/similar")]
    public async Task<ActionResult<List<ProductDto>>> GetSimilarProducts(int id)
    {
        try
        {
            var similarProducts = await _productService.GetSimilarProductsAsync(id);
            return Ok(similarProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting similar products for product ID {ProductId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
