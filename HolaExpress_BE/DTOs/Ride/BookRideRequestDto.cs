namespace HolaExpress_BE.DTOs.Ride;

public class BookRideRequestDto
{
    public int DriverUserId { get; set; }
    public string VehicleType { get; set; } = "MOTORCYCLE";

    public string PickupAddress { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }

    public string DestinationAddress { get; set; } = string.Empty;
    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }

    public double DistanceKm { get; set; }
    public decimal Fare { get; set; }
}
