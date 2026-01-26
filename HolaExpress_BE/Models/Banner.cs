using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Banner
{
    public int BannerId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? Title { get; set; }

    public string? Link { get; set; }

    public bool? IsActive { get; set; }

    public int? Priority { get; set; }

    public DateTime? CreatedAt { get; set; }
}
