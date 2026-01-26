using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class StoreOperatingHour
{
    public int Id { get; set; }

    public int? StoreId { get; set; }

    public int? DayOfWeek { get; set; }

    public TimeOnly? OpenTime { get; set; }

    public TimeOnly? CloseTime { get; set; }

    public bool? IsClosedToday { get; set; }

    public virtual Store? Store { get; set; }
}
