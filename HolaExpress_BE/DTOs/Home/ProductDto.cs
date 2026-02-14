namespace HolaExpress_BE.DTOs.Home;

public class ProductDto
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
    
    // Flash Sale fields
    public int? SoldCount { get; set; }
    public int? TotalStock { get; set; }
    public decimal? OriginalPrice { get; set; }
}
