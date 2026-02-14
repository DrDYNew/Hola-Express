namespace HolaExpress_BE.DTOs.Admin
{
    public class FeeConfigDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class UpdateFeeConfigDto
    {
        public decimal Value { get; set; }
        public bool IsActive { get; set; }
    }
}
