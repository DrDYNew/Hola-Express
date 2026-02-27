namespace HolaExpress_BE.DTOs.Admin;

public class AdminVoucherFilterDto
{
    public string? Search { get; set; }
    public string? DiscountType { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public DateTime? EndDateFrom { get; set; }
    public DateTime? EndDateTo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class AdminVoucherListItemDto
{
    public int VoucherId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderValue { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class AdminVoucherDetailDto : AdminVoucherListItemDto
{
    // Inherits all fields, can be extended in future
}

public class AdminVoucherListResultDto
{
    public List<AdminVoucherListItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class CreateAdminVoucherDto
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "PERCENTAGE";
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderValue { get; set; }
    public int? UsageLimit { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateAdminVoucherDto
{
    public string? Code { get; set; }
    public string? DiscountType { get; set; }
    public decimal? DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderValue { get; set; }
    public int? UsageLimit { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? IsActive { get; set; }
}
