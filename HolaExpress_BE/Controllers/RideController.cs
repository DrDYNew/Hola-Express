using HolaExpress_BE.DTOs.Ride;
using HolaExpress_BE.DTOs.Shipper;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/ride")]
public class RideController : ControllerBase
{
    private readonly IShipperService _shipperService;
    private readonly IRideBookingRepository _rideRepo;
    private readonly ILogger<RideController> _logger;

    public RideController(IShipperService shipperService, IRideBookingRepository rideRepo, ILogger<RideController> logger)
    {
        _shipperService = shipperService;
        _rideRepo       = rideRepo;
        _logger         = logger;
    }

    /// <summary>GET /api/ride/nearby-drivers</summary>
    [HttpGet("nearby-drivers")]
    public async Task<ActionResult<List<NearbyDriverDto>>> GetNearbyDrivers(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radiusKm = 5,
        [FromQuery] string? vehicleType = null)
    {
        try
        {
            if (lat == 0 && lng == 0)
                return BadRequest(new { message = "lat và lng là bắt buộc" });

            var drivers = await _shipperService.GetNearbyDriversAsync(lat, lng, radiusKm, vehicleType);
            return Ok(drivers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby drivers at ({Lat},{Lng})", lat, lng);
            return StatusCode(500, new { message = "Không thể lấy danh sách tài xế" });
        }
    }

    /// <summary>POST /api/ride/book – Đặt xe và lưu vào DB</summary>
    [Authorize]
    [HttpPost("book")]
    public async Task<IActionResult> BookRide([FromBody] BookRideRequestDto dto)
    {
        try
        {
            var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (customerIdClaim == null) return Unauthorized();
            int customerId = int.Parse(customerIdClaim);

            var booking = new RideBooking
            {
                CustomerId         = customerId,
                DriverId           = dto.DriverUserId,
                VehicleType        = dto.VehicleType,
                PickupAddress      = dto.PickupAddress,
                PickupLat          = dto.PickupLat,
                PickupLng          = dto.PickupLng,
                DestinationAddress = dto.DestinationAddress,
                DestinationLat     = dto.DestinationLat,
                DestinationLng     = dto.DestinationLng,
                DistanceKm         = dto.DistanceKm,
                Fare               = dto.Fare,
                Status             = "pending",
            };

            var created = await _rideRepo.CreateAsync(booking);
            return Ok(new { success = true, data = MapToDto(created) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error booking ride");
            return StatusCode(500, new { message = "Không thể đặt xe" });
        }
    }

    /// <summary>GET /api/ride/history – Lịch sử chuyến xe của khách</summary>
    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        try
        {
            var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (customerIdClaim == null) return Unauthorized();
            int customerId = int.Parse(customerIdClaim);

            var bookings = await _rideRepo.GetByCustomerIdAsync(customerId);
            return Ok(new { success = true, data = bookings.Select(MapToDto).ToList() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ride history");
            return StatusCode(500, new { message = "Không thể tải lịch sử" });
        }
    }

    /// <summary>POST /api/ride/{id}/cancel</summary>
    [Authorize]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelRide(int id, [FromBody] CancelRideRequestDto? dto)
    {
        try
        {
            var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (customerIdClaim == null) return Unauthorized();
            int customerId = int.Parse(customerIdClaim);

            var ok = await _rideRepo.CancelAsync(id, customerId, dto?.Reason);
            if (!ok) return BadRequest(new { success = false, message = "Không thể hủy chuyến này" });

            return Ok(new { success = true, message = "Hủy chuyến thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling ride {Id}", id);
            return StatusCode(500, new { message = "Lỗi hủy chuyến" });
        }
    }

    // ── Driver endpoints ──────────────────────────────────────────────────

    /// <summary>GET /api/ride/driver/requests – Danh sách chuyến pending gán cho tài xế này</summary>
    [Authorize]
    [HttpGet("driver/requests")]
    public async Task<IActionResult> GetDriverRequests()
    {
        try
        {
            var driverIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (driverIdClaim == null) return Unauthorized();
            int driverId = int.Parse(driverIdClaim);

            var bookings = await _rideRepo.GetPendingByDriverIdAsync(driverId);
            return Ok(new { success = true, data = bookings.Select(MapToDto).ToList() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting driver requests");
            return StatusCode(500, new { message = "Không thể tải yêu cầu" });
        }
    }

    /// <summary>GET /api/ride/driver/active – Chuyến đang chạy của tài xế</summary>
    [Authorize]
    [HttpGet("driver/active")]
    public async Task<IActionResult> GetDriverActiveRides()
    {
        try
        {
            var driverIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (driverIdClaim == null) return Unauthorized();
            int driverId = int.Parse(driverIdClaim);

            var bookings = await _rideRepo.GetActiveByDriverIdAsync(driverId);
            return Ok(new { success = true, data = bookings.Select(MapToDto).ToList() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active rides");
            return StatusCode(500, new { message = "Không thể tải chuyến đang chạy" });
        }
    }

    /// <summary>POST /api/ride/{id}/accept – Tài xế xác nhận nhận chuyến</summary>
    [Authorize]
    [HttpPost("{id}/accept")]
    public async Task<IActionResult> AcceptRide(int id)
    {
        try
        {
            var driverIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (driverIdClaim == null) return Unauthorized();
            int driverId = int.Parse(driverIdClaim);

            var ok = await _rideRepo.AcceptAsync(id, driverId);
            if (!ok) return BadRequest(new { success = false, message = "Không thể nhận chuyến này" });

            return Ok(new { success = true, message = "Đã nhận chuyến" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting ride {Id}", id);
            return StatusCode(500, new { message = "Lỗi nhận chuyến" });
        }
    }

    /// <summary>POST /api/ride/{id}/update-status – Tài xế cập nhật trạng thái chuyến (arriving|onway|completed)</summary>
    [Authorize]
    [HttpPost("{id}/update-status")]
    public async Task<IActionResult> UpdateRideStatus(int id, [FromBody] UpdateRideStatusDto dto)
    {
        try
        {
            var driverIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (driverIdClaim == null) return Unauthorized();
            int driverId = int.Parse(driverIdClaim);

            var allowed = new[] { "arriving", "onway", "completed" };
            if (!allowed.Contains(dto.Status))
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ" });

            var ok = await _rideRepo.UpdateStatusByDriverAsync(id, driverId, dto.Status);
            if (!ok) return BadRequest(new { success = false, message = "Không thể cập nhật trạng thái" });

            return Ok(new { success = true, message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ride status {Id}", id);
            return StatusCode(500, new { message = "Lỗi cập nhật trạng thái" });
        }
    }

    /// <summary>GET /api/ride/driver/history – Lịch sử chuyến đã hoàn thành/hủy của tài xế</summary>
    [Authorize]
    [HttpGet("driver/history")]
    public async Task<IActionResult> GetDriverHistory()
    {
        try
        {
            var driverIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (driverIdClaim == null) return Unauthorized();
            int driverId = int.Parse(driverIdClaim);

            var bookings = await _rideRepo.GetHistoryByDriverIdAsync(driverId);
            return Ok(new { success = true, data = bookings.Select(MapToDto).ToList() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting driver ride history");
            return StatusCode(500, new { message = "Không thể tải lịch sử" });
        }
    }

    // ── Helper ────────────────────────────────────────────────────────
    private static RideBookingDto MapToDto(RideBooking b) => new()
    {
        RideBookingId      = b.RideBookingId,
        BookingCode        = b.BookingCode,
        CustomerId         = b.CustomerId,
        DriverId           = b.DriverId,
        VehicleType        = b.VehicleType,
        PickupAddress      = b.PickupAddress,
        PickupLat          = b.PickupLat,
        PickupLng          = b.PickupLng,
        DestinationAddress = b.DestinationAddress,
        DestinationLat     = b.DestinationLat,
        DestinationLng     = b.DestinationLng,
        DistanceKm         = b.DistanceKm,
        Fare               = b.Fare,
        Status             = b.Status,
        CancelReason       = b.CancelReason,
        CreatedAt          = b.CreatedAt,
        CustomerName       = b.Customer?.FullName,
        CustomerPhone      = b.Customer?.PhoneNumber,
        DriverName         = b.Driver?.FullName,
    };
}

