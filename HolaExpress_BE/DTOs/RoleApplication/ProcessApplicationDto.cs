using System.ComponentModel.DataAnnotations;

namespace HolaExpress_BE.DTOs.RoleApplication;

/// <summary>
/// DTO: Admin xử lý đơn đăng ký (Duyệt hoặc Từ chối)
/// </summary>
public class ProcessApplicationDto
{
    [Required]
    public int ApplicationId { get; set; }

    [Required(ErrorMessage = "Trạng thái xử lý là bắt buộc")]
    public string Status { get; set; } = null!; // "APPROVED" hoặc "REJECTED"

    [StringLength(1000)]
    public string? AdminNotes { get; set; }

    [StringLength(500)]
    public string? RejectionReason { get; set; }
}
