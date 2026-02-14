namespace HolaExpress_BE.DTOs.Wallet;

public class WalletDto
{
    public int WalletId { get; set; }
    public int UserId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTime? UpdatedAt { get; set; }
}

public class TransactionDto
{
    public int TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string TransactionType { get; set; } = string.Empty; // TOP_UP, WITHDRAW, PAYMENT, REFUND
    public string Description { get; set; } = string.Empty;
    public int? ReferenceOrderId { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class TransactionHistoryDto
{
    public List<TransactionDto> Transactions { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class TopUpRequestDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // MOMO, ZALOPAY, BANK_TRANSFER
    public string? Note { get; set; }
}

public class WithdrawRequestDto
{
    public decimal Amount { get; set; }
    public string BankAccount { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? Note { get; set; }
}

// PayOS DTOs
public class PayOSPaymentResponse
{
    public string Code { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public PayOSData? Data { get; set; }
}

public class PayOSData
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public long OrderCode { get; set; }
    public string PaymentLinkId { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountName { get; set; }
    public string? Bin { get; set; }
}

public class TopUpPaymentDataDto
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string OrderCode { get; set; } = string.Empty;
    public int TransactionId { get; set; }
    public int Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public string? AccountNumber { get; set; }
    public string? AccountName { get; set; }
    public string? Bin { get; set; }
    public string ExpiresAt { get; set; } = string.Empty;
}
