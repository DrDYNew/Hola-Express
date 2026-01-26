namespace HolaExpress_BE.DTOs.Home;

public class BannerDto
{
    public int BannerId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Link { get; set; }
    public bool IsActive { get; set; }
}
