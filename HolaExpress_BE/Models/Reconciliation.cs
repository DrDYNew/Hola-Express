using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HolaExpress_BE.Models
{
    [Table("Reconciliations")]
    public class Reconciliation
    {
        [Key]
        public int ReconciliationId { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // store or shipper

        public int EntityId { get; set; } // StoreId or ShipperId

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int TotalOrders { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DeliveryFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountToPay { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, processing, completed

        [StringLength(500)]
        public string? AdminNote { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ApprovedAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int? ApprovedBy { get; set; }

        [ForeignKey("ApprovedBy")]
        public virtual User? Approver { get; set; }
    }
}
