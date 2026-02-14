using HolaExpress_BE.DTOs.Address;

namespace HolaExpress_BE.Interfaces;

public interface IAddressService
{
    Task<List<AddressDto>> GetUserAddressesAsync(int userId);
    Task<AddressDto?> GetAddressByIdAsync(int userId, int addressId);
    Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto);
    Task<AddressDto?> UpdateAddressAsync(int userId, int addressId, UpdateAddressDto dto);
    Task<bool> DeleteAddressAsync(int userId, int addressId);
    Task<bool> SetDefaultAddressAsync(int userId, int addressId);
}
