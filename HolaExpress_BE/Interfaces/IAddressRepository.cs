using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IAddressRepository
{
    Task<List<UserAddress>> GetUserAddressesAsync(int userId);
    Task<UserAddress?> GetAddressByIdAsync(int addressId);
    Task<UserAddress> CreateAddressAsync(UserAddress address);
    Task<UserAddress?> UpdateAddressAsync(UserAddress address);
    Task<bool> DeleteAddressAsync(int addressId);
    Task<bool> SetDefaultAddressAsync(int userId, int addressId);
    Task<UserAddress?> GetDefaultAddressAsync(int userId);
}
