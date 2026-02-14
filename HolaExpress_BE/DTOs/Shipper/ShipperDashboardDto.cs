namespace HolaExpress_BE.DTOs.Shipper;

public class ShipperDashboardDto
{
    public ShipperStatsDto Stats { get; set; } = new();
    public List<ShipperOrderDto> CurrentOrders { get; set; } = new();
}

public class ShipperStatsDto
{
    public decimal TodayEarnings { get; set; }
    public int CompletedToday { get; set; }
    public int ActiveOrders { get; set; }
    public int TotalDeliveries { get; set; }
    public double AverageRating { get; set; }
}

public class ShipperOrderDto
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
    public double? StoreLatitude { get; set; }
    public double? StoreLongitude { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public double? DeliveryLatitude { get; set; }
    public double? DeliveryLongitude { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public double? Distance { get; set; } // Khoảng cách tính bằng mét
    public string Status { get; set; } = string.Empty;
    public DateTime? PickupTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Notes { get; set; }
    public string? ShipperLocation { get; set; }
}

public class ShipperEarningsDto
{
    public decimal TodayEarnings { get; set; }
    public decimal WeekEarnings { get; set; }
    public decimal MonthEarnings { get; set; }
    public decimal TotalEarnings { get; set; }
    public int TotalDeliveries { get; set; }
    public List<DailyEarningDto> DailyBreakdown { get; set; } = new();
}

public class DailyEarningDto
{
    public DateTime Date { get; set; }
    public decimal Earnings { get; set; }
    public int DeliveriesCount { get; set; }
}

public class UpdateStatusRequest
{
    public bool IsOnline { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
