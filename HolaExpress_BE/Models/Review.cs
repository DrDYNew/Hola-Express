using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Review
{
    public int ReviewId { get; set; }

    public int? OrderId { get; set; }

    public int? UserId { get; set; }

    public int? StoreRating { get; set; }

    public int? ShipperRating { get; set; }

    public string? Comment { get; set; }

    public string? ImageUrl { get; set; }

    public string? ResponseFromStore { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual User? User { get; set; }
}
