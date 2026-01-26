using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Cart
{
    public int CartId { get; set; }

    public int? UserId { get; set; }

    public int? StoreId { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Store? Store { get; set; }

    public virtual User? User { get; set; }
}
