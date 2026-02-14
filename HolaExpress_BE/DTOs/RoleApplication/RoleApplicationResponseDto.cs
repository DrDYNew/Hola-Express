namespace HolaExpress_BE.DTOs.RoleApplication;

/// <summary>
/// DTO: Response thông tin đơn đăng ký
/// </summary>
public class RoleApplicationResponseDto
{
    public int ApplicationId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string RequestedRole { get; set; } = null!;
    public string Status { get; set; } = null!;

    // Shipper specific
    public string? LicenseNumber { get; set; }
    public string? VehiclePlate { get; set; }
    public string? VehicleType { get; set; }
    public string? VehicleTypeOther { get; set; }

    // Owner specific
    public string? BusinessName { get; set; }
    public string? BusinessAddress { get; set; }
    public string? BusinessLicense { get; set; }
    public string? TaxCode { get; set; }

    // Common
    public string? Notes { get; set; }
    public string? AdminNotes { get; set; }
    public string? RejectionReason { get; set; }

    // Document URLs
    public string? IdCardFrontUrl { get; set; }
    public string? IdCardBackUrl { get; set; }
    public string? LicenseFrontUrl { get; set; }
    public string? LicenseBackUrl { get; set; }
    public string? BusinessLicenseDocumentUrl { get; set; }
    public string? TaxCodeDocumentUrl { get; set; }

    public DateTime ApplicationDate { get; set; }
    public DateTime? ProcessedDate { get; set; }
    public int? ProcessedBy { get; set; }
    public string? ProcessedByName { get; set; }
}
