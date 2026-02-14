namespace HolaExpress_BE.DTOs.Cart
{
    public class AddToCartDto
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Note { get; set; }
        public List<int>? ToppingIds { get; set; }
    }

    public class CartItemDto
    {
        public int ItemId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public decimal BasePrice { get; set; }
        public int? VariantId { get; set; }
        public string? VariantName { get; set; }
        public decimal VariantPriceAdjustment { get; set; }
        public int Quantity { get; set; }
        public string? Note { get; set; }
        public List<ToppingInCartDto>? Toppings { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class ToppingInCartDto
    {
        public int ToppingId { get; set; }
        public string ToppingName { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class CartResponseDto
    {
        public int CartId { get; set; }
        public int StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public List<CartItemDto> Items { get; set; } = new();
        public decimal SubTotal { get; set; }
        public int TotalItems { get; set; }
    }
}
