using HolaExpress_BE.DTOs.Address;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Services;

public class AddressService : IAddressService
{
    private readonly IAddressRepository _addressRepository;

    public AddressService(IAddressRepository addressRepository)
    {
        _addressRepository = addressRepository;
    }

    public async Task<List<AddressDto>> GetUserAddressesAsync(int userId)
    {
        var addresses = await _addressRepository.GetUserAddressesAsync(userId);
        return addresses.Select(MapToDto).ToList();
    }

    public async Task<AddressDto?> GetAddressByIdAsync(int userId, int addressId)
    {
        var address = await _addressRepository.GetAddressByIdAsync(addressId);
        
        if (address == null || address.UserId != userId)
        {
            return null;
        }

        return MapToDto(address);
    }

    public async Task<AddressDto> CreateAddressAsync(int userId, CreateAddressDto dto)
    {
        // If this is set as default, or no default exists, handle default logic
        var hasDefault = await _addressRepository.GetDefaultAddressAsync(userId) != null;
        var isDefault = dto.IsDefault == true || !hasDefault;

        if (isDefault)
        {
            await _addressRepository.SetDefaultAddressAsync(userId, -1); // Clear all defaults
        }

        var address = new UserAddress
        {
            UserId = userId,
            AddressText = dto.AddressText,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Label = dto.Label,
            IsDefault = isDefault
        };

        var created = await _addressRepository.CreateAddressAsync(address);
        return MapToDto(created);
    }

    public async Task<AddressDto?> UpdateAddressAsync(int userId, int addressId, UpdateAddressDto dto)
    {
        var address = await _addressRepository.GetAddressByIdAsync(addressId);
        
        if (address == null || address.UserId != userId)
        {
            return null;
        }

        // If setting as default, remove default from other addresses
        if (dto.IsDefault == true && address.IsDefault != true)
        {
            await _addressRepository.SetDefaultAddressAsync(userId, addressId);
        }

        address.AddressText = dto.AddressText;
        address.Latitude = dto.Latitude;
        address.Longitude = dto.Longitude;
        address.Label = dto.Label;
        address.IsDefault = dto.IsDefault;

        var updated = await _addressRepository.UpdateAddressAsync(address);
        return updated != null ? MapToDto(updated) : null;
    }

    public async Task<bool> DeleteAddressAsync(int userId, int addressId)
    {
        var address = await _addressRepository.GetAddressByIdAsync(addressId);
        
        if (address == null || address.UserId != userId)
        {
            return false;
        }

        var wasDefault = address.IsDefault == true;
        var deleted = await _addressRepository.DeleteAddressAsync(addressId);

        // If deleted address was default, set first address as default
        if (deleted && wasDefault)
        {
            var addresses = await _addressRepository.GetUserAddressesAsync(userId);
            if (addresses.Any())
            {
                await _addressRepository.SetDefaultAddressAsync(userId, addresses.First().AddressId);
            }
        }

        return deleted;
    }

    public async Task<bool> SetDefaultAddressAsync(int userId, int addressId)
    {
        var address = await _addressRepository.GetAddressByIdAsync(addressId);
        
        if (address == null || address.UserId != userId)
        {
            return false;
        }

        return await _addressRepository.SetDefaultAddressAsync(userId, addressId);
    }

    private static AddressDto MapToDto(UserAddress address)
    {
        return new AddressDto
        {
            AddressId = address.AddressId,
            UserId = address.UserId ?? 0,
            AddressText = address.AddressText ?? string.Empty,
            Latitude = address.Latitude,
            Longitude = address.Longitude,
            Label = address.Label,
            IsDefault = address.IsDefault
        };
    }
}
