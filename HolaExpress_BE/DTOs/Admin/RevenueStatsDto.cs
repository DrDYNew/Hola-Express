namespace HolaExpress_BE.DTOs.Admin
{
    public class RevenueStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal OrderRevenue { get; set; }
        public decimal DeliveryRevenue { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal GrowthRate { get; set; }
        public List<DailyRevenueDto> DailyRevenues { get; set; } = new();
        public List<TopStoreDto> TopStores { get; set; } = new();
    }

    public class DailyRevenueDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class TopStoreDto
    {
        public int StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
    }

    public class RevenueQueryDto
    {
        public string Period { get; set; } = "month"; // today, week, month, year
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
