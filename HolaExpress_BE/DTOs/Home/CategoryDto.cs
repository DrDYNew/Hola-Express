namespace HolaExpress_BE.DTOs.Home;

public class CategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int ProductCount { get; set; }
}
