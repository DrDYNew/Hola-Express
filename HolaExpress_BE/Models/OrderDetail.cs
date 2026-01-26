using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class OrderDetail
{
    public int DetailId { get; set; }

    public int? OrderId { get; set; }

    public int? ProductId { get; set; }

    public string? ProductNameSnapshot { get; set; }

    public string? VariantNameSnapshot { get; set; }

    public int Quantity { get; set; }

    public decimal? PriceSnapshot { get; set; }

    public decimal? TotalPrice { get; set; }

    public virtual Order? Order { get; set; }

    public virtual ICollection<OrderDetailTopping> OrderDetailToppings { get; set; } = new List<OrderDetailTopping>();

    public virtual Product? Product { get; set; }
}
