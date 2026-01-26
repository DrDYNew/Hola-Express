using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class WalletTransaction
{
    public int TransactionId { get; set; }

    public int? WalletId { get; set; }

    public decimal Amount { get; set; }

    public string? TransactionType { get; set; }

    public string? Description { get; set; }

    public int? ReferenceOrderId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Wallet? Wallet { get; set; }
}
