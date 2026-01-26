using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public int? StoreId { get; set; }

    public string CategoryName { get; set; } = null!;

    public int? Priority { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual Store? Store { get; set; }
}
