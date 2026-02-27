namespace HolaExpress_BE.DTOs.Ride;

public class UpdateRideStatusDto
{
    /// <summary>arriving | onway | completed</summary>
    public string Status { get; set; } = string.Empty;
}
