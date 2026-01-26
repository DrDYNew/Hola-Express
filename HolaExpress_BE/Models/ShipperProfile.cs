using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class ShipperProfile
{
    public int ProfileId { get; set; }

    public int? UserId { get; set; }

    public string? LicenseNumber { get; set; }

    public string? VehiclePlate { get; set; }

    public bool? IsOnline { get; set; }

    public double? CurrentLat { get; set; }

    public double? CurrentLong { get; set; }

    public DateTime? LastLocationUpdate { get; set; }

    public virtual User? User { get; set; }
}
