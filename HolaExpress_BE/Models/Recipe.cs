using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Recipe
{
    public int RecipeId { get; set; }

    public int? ProductId { get; set; }

    public int? VariantId { get; set; }

    public int? IngredientId { get; set; }

    public decimal QuantityNeeded { get; set; }

    public virtual Ingredient? Ingredient { get; set; }

    public virtual Product? Product { get; set; }

    public virtual ProductVariant? Variant { get; set; }
}
