namespace HolaExpress_BE.DTOs.Owner;

public class ProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int StoreId { get; set; } // Primary store for backward compatibility
    public string? StoreName { get; set; }
    public List<int> StoreIds { get; set; } = new(); // Multi-store support
    public List<string> StoreNames { get; set; } = new(); // Multi-store support
    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }
    public decimal? DiscountPercent { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<ToppingDto> Toppings { get; set; } = new();
}

public class ToppingDto
{
    public int ToppingId { get; set; }
    public string ToppingName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
}

public class CreateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int? CategoryId { get; set; }
    public string? NewCategoryName { get; set; }
    public int StoreId { get; set; } // Primary store (legacy)
    public List<int> StoreIds { get; set; } = new(); // Multi-store support
    public bool IsAvailable { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public decimal? DiscountPercent { get; set; }
}

public class UpdateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int? CategoryId { get; set; }
    public string? NewCategoryName { get; set; }
    public List<int> StoreIds { get; set; } = new(); // Multi-store support
    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }
    public decimal? DiscountPercent { get; set; }
}

public class CreateToppingDto
{
    public string ToppingName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public class UpdateToppingDto
{
    public string ToppingName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
}

public class CategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

public class CreateCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
}
