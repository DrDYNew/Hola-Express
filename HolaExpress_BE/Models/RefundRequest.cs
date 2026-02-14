using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HolaExpress_BE.Models
{
    [Table("RefundRequests")]
    public class RefundRequest
    {
        [Key]
        public int RefundRequestId { get; set; }

        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        public int CustomerId { get; set; }

        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal RefundAmount { get; set; }

        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, approved, rejected, processing, completed

        [StringLength(1000)]
        public string? AdminNote { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.UtcNow;

        public DateTime? ProcessedAt { get; set; }

        public int? ProcessedBy { get; set; }

        [ForeignKey("ProcessedBy")]
        public virtual User? ProcessedByUser { get; set; }
    }
}
