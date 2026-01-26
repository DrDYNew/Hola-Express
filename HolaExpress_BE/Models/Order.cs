using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public string? OrderCode { get; set; }

    public int? CustomerId { get; set; }

    public int? StoreId { get; set; }

    public int? ShipperId { get; set; }

    public int? VoucherId { get; set; }

    public decimal Subtotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? PlatformFee { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Status { get; set; }

    public string? PaymentMethod { get; set; }

    public string? PaymentStatus { get; set; }

    public string? OrderSource { get; set; }

    public string? DeliveryAddress { get; set; }

    public string? CustomerNote { get; set; }

    public string? CancelReason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual User? Customer { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual Review? Review { get; set; }

    public virtual User? Shipper { get; set; }

    public virtual Store? Store { get; set; }

    public virtual Voucher? Voucher { get; set; }
}
