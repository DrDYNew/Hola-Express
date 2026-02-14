using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class ProductTopping
{
    public int ProductId { get; set; }

    public int ToppingId { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Topping Topping { get; set; } = null!;
}
