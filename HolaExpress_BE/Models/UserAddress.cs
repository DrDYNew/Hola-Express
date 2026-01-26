using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class UserAddress
{
    public int AddressId { get; set; }

    public int? UserId { get; set; }

    public string AddressText { get; set; } = null!;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string? Label { get; set; }

    public bool? IsDefault { get; set; }

    public virtual User? User { get; set; }
}
