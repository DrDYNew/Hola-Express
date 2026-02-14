using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class CartItemTopping
{
    public int Id { get; set; }

    public int? CartItemId { get; set; }

    public int? ToppingId { get; set; }

    public virtual CartItem? CartItem { get; set; }

    public virtual Topping? Topping { get; set; }
}
