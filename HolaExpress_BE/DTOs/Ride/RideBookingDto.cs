namespace HolaExpress_BE.DTOs.Ride;

public class RideBookingDto
{
    public int RideBookingId { get; set; }
    public string? BookingCode { get; set; }
    public int CustomerId { get; set; }
    public int? DriverId { get; set; }
    public string? DriverName { get; set; }
    public string? VehiclePlate { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public string PickupAddress { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }
    public double DistanceKm { get; set; }
    public decimal Fare { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CancelReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
