using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Product
{
    public int ProductId { get; set; }

    public int? StoreId { get; set; }

    public int? CategoryId { get; set; }

    public string ProductName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal BasePrice { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsSoldOut { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();

    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();

    public virtual Store? Store { get; set; }
}
