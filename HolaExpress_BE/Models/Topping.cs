using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Topping
{
    public int ToppingId { get; set; }

    public int? StoreId { get; set; }

    public string? ToppingName { get; set; }

    public decimal? Price { get; set; }

    public bool? IsAvailable { get; set; }

    public virtual Store? Store { get; set; }
}
