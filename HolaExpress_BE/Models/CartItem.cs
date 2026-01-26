using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class CartItem
{
    public int ItemId { get; set; }

    public int? CartId { get; set; }

    public int? ProductId { get; set; }

    public int? VariantId { get; set; }

    public int? Quantity { get; set; }

    public string? Note { get; set; }

    public virtual Cart? Cart { get; set; }

    public virtual Product? Product { get; set; }
}
