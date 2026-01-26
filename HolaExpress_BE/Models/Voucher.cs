using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Voucher
{
    public int VoucherId { get; set; }

    public int? StoreId { get; set; }

    public string Code { get; set; } = null!;

    public string? DiscountType { get; set; }

    public decimal DiscountValue { get; set; }

    public decimal? MaxDiscountAmount { get; set; }

    public decimal? MinOrderValue { get; set; }

    public int? UsageLimit { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual Store? Store { get; set; }
}
