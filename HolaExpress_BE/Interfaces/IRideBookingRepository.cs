using HolaExpress_BE.DTOs.Ride;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IRideBookingRepository
{
    Task<RideBooking> CreateAsync(RideBooking booking);
    Task<List<RideBooking>> GetByCustomerIdAsync(int customerId);
    Task<RideBooking?> GetByIdAsync(int id);
    Task<bool> CancelAsync(int rideBookingId, int customerId, string? reason = null);
    Task<bool> UpdateStatusAsync(int rideBookingId, string status);

    // Driver-side
    Task<List<RideBooking>> GetPendingByDriverIdAsync(int driverId);
    Task<List<RideBooking>> GetActiveByDriverIdAsync(int driverId);
    Task<bool> AcceptAsync(int rideBookingId, int driverId);
    Task<bool> UpdateStatusByDriverAsync(int rideBookingId, int driverId, string newStatus);
    Task<List<RideBooking>> GetHistoryByDriverIdAsync(int driverId);
}
