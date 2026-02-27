namespace HolaExpress_BE.DTOs.Admin
{
    // ─── Query / Filter ────────────────────────────────────────────────────────

    /// <summary>
    /// Params để filter danh sách đơn đăng ký vai trò
    /// </summary>
    public class AdminRoleApplicationFilterDto
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;

        /// <summary>PENDING | APPROVED | REJECTED</summary>
        public string? Status { get; set; }

        /// <summary>SHIPPER | OWNER</summary>
        public string? RequestedRole { get; set; }

        /// <summary>Tìm theo tên hoặc số điện thoại người đăng ký</summary>
        public string? Search { get; set; }

        /// <summary>Lọc theo ngày nộp đơn (từ)</summary>
        public DateTime? FromDate { get; set; }

        /// <summary>Lọc theo ngày nộp đơn (đến)</summary>
        public DateTime? ToDate { get; set; }
    }

    // ─── List item ─────────────────────────────────────────────────────────────

    public class AdminRoleApplicationListItemDto
    {
        public int ApplicationId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string? UserEmail { get; set; }
        public string? UserAvatarUrl { get; set; }
        public string RequestedRole { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ApplicationDate { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public string? ProcessedByName { get; set; }
    }

    // ─── Detail ────────────────────────────────────────────────────────────────

    public class AdminRoleApplicationDetailDto
    {
        public int ApplicationId { get; set; }

        // Applicant info
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string? UserEmail { get; set; }
        public string? UserAvatarUrl { get; set; }

        public string RequestedRole { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

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
        public DateTime CreatedAt { get; set; }
    }

    // ─── Paginated list wrapper ─────────────────────────────────────────────────

    public class AdminRoleApplicationListDto
    {
        public List<AdminRoleApplicationListItemDto> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }

    // ─── Process request (approve / reject) ────────────────────────────────────

    public class AdminProcessApplicationDto
    {
        /// <summary>APPROVED | REJECTED</summary>
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public string? RejectionReason { get; set; }
    }
}
