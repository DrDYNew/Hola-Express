using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class OrderDetailTopping
{
    public int Id { get; set; }

    public int? DetailId { get; set; }

    public string? ToppingNameSnapshot { get; set; }

    public decimal? PriceSnapshot { get; set; }

    public virtual OrderDetail? Detail { get; set; }
}
