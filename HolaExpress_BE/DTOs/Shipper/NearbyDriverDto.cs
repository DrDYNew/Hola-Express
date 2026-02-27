namespace HolaExpress_BE.DTOs.Shipper;

public class NearbyDriverDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int TotalTrips { get; set; }
    public string VehicleType { get; set; } = string.Empty;   // MOTORCYCLE | CAR
    public string VehiclePlate { get; set; } = string.Empty;
    public string? VehicleName { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public bool IsOnline { get; set; }
    /// <summary>Distance in km from the requester</summary>
    public double DistanceKm { get; set; }
    public string? AvatarUrl { get; set; }
}
