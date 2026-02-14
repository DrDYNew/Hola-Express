using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class AddressRepository : IAddressRepository
{
    private readonly HolaExpressContext _context;

    public AddressRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<List<UserAddress>> GetUserAddressesAsync(int userId)
    {
        return await _context.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.AddressId)
            .ToListAsync();
    }

    public async Task<UserAddress?> GetAddressByIdAsync(int addressId)
    {
        return await _context.UserAddresses.FindAsync(addressId);
    }

    public async Task<UserAddress> CreateAddressAsync(UserAddress address)
    {
        _context.UserAddresses.Add(address);
        await _context.SaveChangesAsync();
        return address;
    }

    public async Task<UserAddress?> UpdateAddressAsync(UserAddress address)
    {
        _context.UserAddresses.Update(address);
        await _context.SaveChangesAsync();
        return address;
    }

    public async Task<bool> DeleteAddressAsync(int addressId)
    {
        var address = await _context.UserAddresses.FindAsync(addressId);
        if (address == null)
        {
            return false;
        }

        _context.UserAddresses.Remove(address);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetDefaultAddressAsync(int userId, int addressId)
    {
        // Remove default from all user's addresses
        var addresses = await _context.UserAddresses
            .Where(a => a.UserId == userId)
            .ToListAsync();

        foreach (var addr in addresses)
        {
            addr.IsDefault = addr.AddressId == addressId;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<UserAddress?> GetDefaultAddressAsync(int userId)
    {
        return await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault == true);
    }
}
