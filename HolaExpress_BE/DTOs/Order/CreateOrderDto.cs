namespace HolaExpress_BE.DTOs.Order;

public class CreateOrderDto
{
    public int StoreId { get; set; }
    public int UserAddressId { get; set; }
    public string? CustomerNote { get; set; }
    public string PaymentMethod { get; set; } = "cash"; // cash, wallet, payos
    public int? VoucherId { get; set; }
    public decimal ShippingFee { get; set; }
}

public class CreateOrderResponseDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public PaymentDataDto? PaymentData { get; set; }
}

public class PaymentDataDto
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string OrderCode { get; set; } = string.Empty;
    public string QrCode { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public long ExpiresAt { get; set; }
}
