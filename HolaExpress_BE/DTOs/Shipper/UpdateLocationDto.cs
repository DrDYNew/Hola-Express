namespace HolaExpress_BE.DTOs.Shipper;

public class UpdateLocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? FormattedAddress { get; set; }
}
