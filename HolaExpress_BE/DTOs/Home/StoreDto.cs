namespace HolaExpress_BE.DTOs.Home;

public class StoreDto
{
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal Rating { get; set; }
    public int? DeliveryTime { get; set; }
    public double? Distance { get; set; }
    public List<string> Tags { get; set; } = new();
    public int? DiscountPercent { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsOpen { get; set; }
    public decimal? MinOrder { get; set; }
}
