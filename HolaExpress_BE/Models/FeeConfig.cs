using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HolaExpress_BE.Models
{
    [Table("FeeConfigs")]
    public class FeeConfig
    {
        [Key]
        public int FeeConfigId { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // percentage or fixed

        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }

        [StringLength(10)]
        public string Unit { get; set; } = string.Empty;

        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
