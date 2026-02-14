namespace HolaExpress_BE.DTOs.Owner;

public class StoreDto
{
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Hotline { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsOpenNow { get; set; }
    public decimal Rating { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int OwnerId { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class CreateStoreDto
{
    public string StoreName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Hotline { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public class UpdateStoreDto
{
    public string StoreName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Hotline { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
