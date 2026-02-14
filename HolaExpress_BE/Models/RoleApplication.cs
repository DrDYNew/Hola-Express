using System;

namespace HolaExpress_BE.Models;

public partial class RoleApplication
{
    public int ApplicationId { get; set; }

    public int UserId { get; set; }

    public string RequestedRole { get; set; } = null!;

    public string Status { get; set; } = "PENDING";

    // Shipper specific fields
    public string? LicenseNumber { get; set; }

    public string? VehiclePlate { get; set; }

    // Owner specific fields
    public string? BusinessName { get; set; }

    public string? BusinessAddress { get; set; }

    public string? BusinessLicense { get; set; }

    public string? TaxCode { get; set; }

    // Common fields
    public string? Notes { get; set; }

    public string? AdminNotes { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime ApplicationDate { get; set; }

    public DateTime? ProcessedDate { get; set; }

    public int? ProcessedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Document fields
    public int? IdCardFrontMediaId { get; set; }

    public int? IdCardBackMediaId { get; set; }

    public int? LicenseFrontMediaId { get; set; }

    public int? LicenseBackMediaId { get; set; }

    public string? VehicleType { get; set; }

    public string? VehicleTypeOther { get; set; }

    public int? BusinessLicenseMediaId { get; set; }

    public int? TaxCodeMediaId { get; set; }

    public string? OtherDocumentsJson { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;

    public virtual User? ProcessedByUser { get; set; }

    public virtual Media? IdCardFrontMedia { get; set; }

    public virtual Media? IdCardBackMedia { get; set; }

    public virtual Media? LicenseFrontMedia { get; set; }

    public virtual Media? LicenseBackMedia { get; set; }

    public virtual Media? BusinessLicenseMedia { get; set; }

    public virtual Media? TaxCodeMedia { get; set; }
}
