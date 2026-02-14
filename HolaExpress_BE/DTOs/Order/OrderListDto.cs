namespace HolaExpress_BE.DTOs.Order;

public class OrderListDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
    public double StoreLatitude { get; set; }
    public double StoreLongitude { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public double? DeliveryLatitude { get; set; }
    public double? DeliveryLongitude { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public List<string> Toppings { get; set; } = new();
}

public class ShipperDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public double CurrentLat { get; set; }
    public double CurrentLong { get; set; }
    public bool IsOnline { get; set; }
}

public class AssignShipperRequest
{
    public int ShipperId { get; set; }
}
