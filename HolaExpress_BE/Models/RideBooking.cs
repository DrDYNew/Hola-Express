using System.ComponentModel.DataAnnotations.Schema;

namespace HolaExpress_BE.Models;

/// <summary>
/// Lưu mỗi chuyến xe được đặt bởi khách hàng.
/// Status: pending | accepted | arriving | onway | completed | cancelled
/// </summary>
public partial class RideBooking
{
    public int RideBookingId { get; set; }

    /// <summary>Mã chuyến xe hiển thị cho người dùng (RX-XXXXXX)</summary>
    public string? BookingCode { get; set; }

    public int CustomerId { get; set; }

    /// <summary>Tài xế được chọn (nullable cho đến khi tài xế xác nhận)</summary>
    public int? DriverId { get; set; }

    public string VehicleType { get; set; } = "MOTORCYCLE"; // MOTORCYCLE | CAR

    public string PickupAddress { get; set; } = string.Empty;
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }

    public string DestinationAddress { get; set; } = string.Empty;
    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }

    public double DistanceKm { get; set; }
    public decimal Fare { get; set; }

    /// <summary>pending | accepted | arriving | onway | completed | cancelled</summary>
    public string Status { get; set; } = "pending";

    public string? CancelReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation
    [ForeignKey("CustomerId")]
    public virtual User? Customer { get; set; }

    [ForeignKey("DriverId")]
    public virtual User? Driver { get; set; }
}
