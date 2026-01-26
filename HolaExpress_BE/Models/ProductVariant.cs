using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class ProductVariant
{
    public int VariantId { get; set; }

    public int? ProductId { get; set; }

    public string? VariantName { get; set; }

    public decimal? PriceAdjustment { get; set; }

    public virtual Product? Product { get; set; }

    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}
