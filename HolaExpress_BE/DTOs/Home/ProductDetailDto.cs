namespace HolaExpress_BE.DTOs.Home;

public class ProductDetailDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public decimal BasePrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public int? DiscountPercent { get; set; }
    public int CategoryId { get; set; }
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public decimal StoreRating { get; set; }
    public bool IsActive { get; set; }
    public bool IsSoldOut { get; set; }
    
    // Additional fields for detail view
    public List<VariantDto> Variants { get; set; } = new();
    public List<ToppingDto> AvailableToppings { get; set; } = new();
}

public class VariantDto
{
    public int VariantId { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; }
}

public class ToppingDto
{
    public int ToppingId { get; set; }
    public string ToppingName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
}
