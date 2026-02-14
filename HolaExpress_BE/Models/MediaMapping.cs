using System;

namespace HolaExpress_BE.Models;

public partial class MediaMapping
{
    public int MappingId { get; set; }

    public int MediaId { get; set; }

    public string EntityType { get; set; } = null!;

    public int EntityId { get; set; }

    public string? MediaType { get; set; }

    public int? DisplayOrder { get; set; }

    public DateTime? CreatedDate { get; set; }

    public virtual Media Media { get; set; } = null!;
}
