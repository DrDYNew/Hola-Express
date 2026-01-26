using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Ingredient
{
    public int IngredientId { get; set; }

    public int? StoreId { get; set; }

    public string IngredientName { get; set; } = null!;

    public string? Unit { get; set; }

    public decimal? CurrentStock { get; set; }

    public decimal? MinStockAlert { get; set; }

    public DateTime? LastUpdated { get; set; }

    public virtual ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();

    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();

    public virtual Store? Store { get; set; }
}
