using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class RideBookingRepository : IRideBookingRepository
{
    private readonly HolaExpressContext _context;

    public RideBookingRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<RideBooking> CreateAsync(RideBooking booking)
    {
        // Generate booking code: RX-XXXXXX
        booking.BookingCode = $"RX-{DateTime.Now:yyMMdd}{new Random().Next(100, 999)}";
        booking.CreatedAt   = DateTime.Now;
        booking.UpdatedAt   = DateTime.Now;

        _context.RideBookings.Add(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    public async Task<List<RideBooking>> GetByCustomerIdAsync(int customerId)
    {
        return await _context.RideBookings
            .Include(r => r.Customer)
            .Include(r => r.Driver)
            .Where(r => r.CustomerId == customerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<RideBooking?> GetByIdAsync(int id)
    {
        return await _context.RideBookings
            .Include(r => r.Customer)
            .Include(r => r.Driver)
            .FirstOrDefaultAsync(r => r.RideBookingId == id);
    }

    public async Task<bool> CancelAsync(int rideBookingId, int customerId, string? reason = null)
    {
        var booking = await _context.RideBookings
            .FirstOrDefaultAsync(r => r.RideBookingId == rideBookingId && r.CustomerId == customerId);

        if (booking == null) return false;
        if (booking.Status != "pending" && booking.Status != "accepted") return false;

        booking.Status       = "cancelled";
        booking.CancelReason = reason;
        booking.UpdatedAt    = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int rideBookingId, string status)
    {
        var booking = await _context.RideBookings.FindAsync(rideBookingId);
        if (booking == null) return false;

        booking.Status    = status;
        booking.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    // ── Driver-side ──────────────────────────────────────────────────────────

    public async Task<List<RideBooking>> GetPendingByDriverIdAsync(int driverId)
    {
        // Trả về:
        //  1. Chuyến pending gán đúng tài xế này (DriverId == driverId)
        //  2. Chuyến pending chưa gán tài xế nào (DriverId == null) → broadcast cho mọi tài xế
        return await _context.RideBookings
            .Include(r => r.Customer)
            .Include(r => r.Driver)
            .Where(r => r.Status == "pending"
                     && (!r.DriverId.HasValue || r.DriverId.Value == driverId))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<RideBooking>> GetActiveByDriverIdAsync(int driverId)
    {
        var activeStatuses = new[] { "accepted", "arriving", "onway" };
        return await _context.RideBookings
            .Include(r => r.Customer)
            .Include(r => r.Driver)
            .Where(r => r.DriverId.HasValue && r.DriverId.Value == driverId && activeStatuses.Contains(r.Status))
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();
    }

    public async Task<bool> AcceptAsync(int rideBookingId, int driverId)
    {
        // Cho phép nhận chuyến đã gán đúng driverId HOẶC chuyến broadcast (DriverId null)
        var booking = await _context.RideBookings
            .FirstOrDefaultAsync(r => r.RideBookingId == rideBookingId
                                   && r.Status == "pending"
                                   && (!r.DriverId.HasValue || r.DriverId.Value == driverId));
        if (booking == null) return false;

        booking.DriverId  = driverId;   // gán tài xế nếu chưa có
        booking.Status    = "accepted";
        booking.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateStatusByDriverAsync(int rideBookingId, int driverId, string newStatus)
    {
        var booking = await _context.RideBookings
            .FirstOrDefaultAsync(r => r.RideBookingId == rideBookingId && r.DriverId.HasValue && r.DriverId.Value == driverId);
        if (booking == null) return false;

        booking.Status    = newStatus;
        booking.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<RideBooking>> GetHistoryByDriverIdAsync(int driverId)
    {
        var doneStatuses = new[] { "completed", "cancelled" };
        return await _context.RideBookings
            .Include(r => r.Customer)
            .Include(r => r.Driver)
            .Where(r => r.DriverId.HasValue && r.DriverId.Value == driverId && doneStatuses.Contains(r.Status))
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();
    }
}
