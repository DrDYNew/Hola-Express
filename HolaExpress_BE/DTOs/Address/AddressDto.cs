namespace HolaExpress_BE.DTOs.Address;

public class AddressDto
{
    public int AddressId { get; set; }
    public int UserId { get; set; }
    public string AddressText { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Label { get; set; }
    public bool? IsDefault { get; set; }
}

public class CreateAddressDto
{
    public string AddressText { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Label { get; set; }
    public bool? IsDefault { get; set; }
}

public class UpdateAddressDto
{
    public string AddressText { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Label { get; set; }
    public bool? IsDefault { get; set; }
}
