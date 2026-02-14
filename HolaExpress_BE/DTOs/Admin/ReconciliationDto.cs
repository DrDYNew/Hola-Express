namespace HolaExpress_BE.DTOs.Admin
{
    public class ReconciliationItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // store or shipper
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal AmountToPay { get; set; }
        public string Status { get; set; } = string.Empty; // pending, processing, completed
        public string Period { get; set; } = string.Empty;
        public DateTime? ApprovedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class UpdateReconciliationStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminNote { get; set; }
    }
}
