using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class InventoryTransaction
{
    public int TransId { get; set; }

    public int? IngredientId { get; set; }

    public int? SupplierId { get; set; }

    public string? Type { get; set; }

    public decimal QuantityChange { get; set; }

    public decimal? UnitCost { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public virtual Ingredient? Ingredient { get; set; }

    public virtual Supplier? Supplier { get; set; }
}
