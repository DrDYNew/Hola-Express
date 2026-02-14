using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Media
{
    public int MediaId { get; set; }

    public string FileName { get; set; } = null!;

    public string? OriginalFileName { get; set; }

    public string FilePath { get; set; } = null!;

    public long? FileSize { get; set; }

    public string? FileType { get; set; }

    public string? MimeType { get; set; }

    public int? UploadedByUserId { get; set; }

    public DateTime? UploadDate { get; set; }

    public bool? IsActive { get; set; }

    public virtual User? UploadedByUser { get; set; }

    public virtual ICollection<MediaMapping> MediaMappings { get; set; } = new List<MediaMapping>();
}
