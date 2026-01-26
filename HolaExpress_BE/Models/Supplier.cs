using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Supplier
{
    public int SupplierId { get; set; }

    public int? StoreId { get; set; }

    public string? SupplierName { get; set; }

    public string? ContactPhone { get; set; }

    public string? Address { get; set; }

    public virtual ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();

    public virtual Store? Store { get; set; }
}
