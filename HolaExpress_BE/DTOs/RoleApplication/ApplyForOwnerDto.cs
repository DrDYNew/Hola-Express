using System.ComponentModel.DataAnnotations;

namespace HolaExpress_BE.DTOs.RoleApplication;

/// <summary>
/// DTO: Đăng ký làm Owner (Chủ quán)
/// </summary>
public class ApplyForOwnerDto
{
    [Required(ErrorMessage = "Tên cửa hàng là bắt buộc")]
    [StringLength(200)]
    public string BusinessName { get; set; } = null!;

    [Required(ErrorMessage = "Địa chỉ cửa hàng là bắt buộc")]
    [StringLength(500)]
    public string BusinessAddress { get; set; } = null!;

    [Required(ErrorMessage = "Số giấy phép kinh doanh là bắt buộc")]
    [StringLength(100)]
    public string BusinessLicense { get; set; } = null!;

    [StringLength(50)]
    public string? TaxCode { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    // Document IDs (uploaded separately via media upload endpoint)
    [Required(ErrorMessage = "Ảnh CMND/CCCD mặt trước là bắt buộc")]
    public int IdCardFrontMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh CMND/CCCD mặt sau là bắt buộc")]
    public int IdCardBackMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh giấy phép kinh doanh là bắt buộc")]
    public int BusinessLicenseMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh giấy đăng ký mã số thuế là bắt buộc")]
    public int TaxCodeMediaId { get; set; }
}
