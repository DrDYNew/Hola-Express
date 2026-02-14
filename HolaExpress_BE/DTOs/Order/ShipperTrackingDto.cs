namespace HolaExpress_BE.DTOs.Order;

public class ShipperTrackingDto
{
    public int ShipperId { get; set; }
    public string? ShipperName { get; set; }
    public string? ShipperPhone { get; set; }
    public string? ShipperAvatar { get; set; }
    public string? VehiclePlate { get; set; }
    public double? CurrentLat { get; set; }
    public double? CurrentLong { get; set; }
    public string? FormattedAddress { get; set; }
    public DateTime? LastLocationUpdate { get; set; }
    public bool IsOnline { get; set; }
    
    // Order info
    public string? OrderStatus { get; set; }
    public string? DeliveryAddress { get; set; }
    
    // Distance info (optional - có thể tính từ frontend)
    public double? DistanceToCustomer { get; set; } // Khoảng cách từ shipper đến khách (meters)
    public int? EstimatedArrivalMinutes { get; set; } // Thời gian dự kiến đến (phút)
}
