namespace HolaExpress_BE.DTOs.Admin
{
    public class RefundRequestDto
    {
        public int Id { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string StoreName { get; set; } = string.Empty;
        public decimal OrderAmount { get; set; }
        public decimal RefundAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public string Status { get; set; } = string.Empty; // pending, approved, rejected, processing, completed
        public string? AdminNote { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public class ProcessRefundDto
    {
        public string Status { get; set; } = string.Empty; // approved, rejected, completed
        public string AdminNote { get; set; } = string.Empty;
    }
}
