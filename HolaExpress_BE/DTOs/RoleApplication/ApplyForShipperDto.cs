using System.ComponentModel.DataAnnotations;

namespace HolaExpress_BE.DTOs.RoleApplication;

/// <summary>
/// DTO: Đăng ký làm Shipper
/// </summary>
public class ApplyForShipperDto
{
    [Required(ErrorMessage = "Số giấy phép lái xe là bắt buộc")]
    [StringLength(50)]
    public string LicenseNumber { get; set; } = null!;

    [Required(ErrorMessage = "Biển số xe là bắt buộc")]
    [StringLength(20)]
    public string VehiclePlate { get; set; } = null!;

    [Required(ErrorMessage = "Loại xe là bắt buộc")]
    [StringLength(50)]
    public string VehicleType { get; set; } = null!; // MOTORCYCLE, CAR, OTHER

    [StringLength(100)]
    public string? VehicleTypeOther { get; set; } // Custom vehicle type when VehicleType is OTHER

    [StringLength(1000)]
    public string? Notes { get; set; }

    // Document IDs (uploaded separately via media upload endpoint)
    [Required(ErrorMessage = "Ảnh CMND/CCCD mặt trước là bắt buộc")]
    public int IdCardFrontMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh CMND/CCCD mặt sau là bắt buộc")]
    public int IdCardBackMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh bằng lái xe mặt trước là bắt buộc")]
    public int LicenseFrontMediaId { get; set; }

    [Required(ErrorMessage = "Ảnh bằng lái xe mặt sau là bắt buộc")]
    public int LicenseBackMediaId { get; set; }
}
