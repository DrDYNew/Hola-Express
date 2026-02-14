using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Repositories.Owner;

public class StoreManagementRepository : IStoreManagementRepository
{
    private readonly HolaExpressContext _context;

    public StoreManagementRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StoreDto>> GetOwnerStoresAsync(int ownerId)
    {
        return await _context.Stores
            .Where(s => s.OwnerId == ownerId)
            .Select(s => new StoreDto
            {
                StoreId = s.StoreId,
                StoreName = s.StoreName ?? string.Empty,
                Address = s.Address ?? string.Empty,
                Hotline = s.Hotline ?? string.Empty,
                IsActive = s.IsActive ?? false,
                IsOpenNow = s.IsOpenNow ?? false,
                Rating = s.Rating ?? 0,
                Latitude = s.Latitude.HasValue ? (decimal?)s.Latitude.Value : null,
                Longitude = s.Longitude.HasValue ? (decimal?)s.Longitude.Value : null,
                OwnerId = s.OwnerId ?? 0,
                ImageUrls = _context.MediaMappings
                    .Where(mm => mm.EntityType == "Store" && mm.EntityId == s.StoreId)
                    .OrderBy(mm => mm.DisplayOrder)
                    .Select(mm => mm.Media.FilePath)
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<StoreDto?> GetStoreByIdAsync(int storeId, int ownerId)
    {
        return await _context.Stores
            .Where(s => s.StoreId == storeId && s.OwnerId == ownerId)
            .Select(s => new StoreDto
            {
                StoreId = s.StoreId,
                StoreName = s.StoreName ?? string.Empty,
                Address = s.Address ?? string.Empty,
                Hotline = s.Hotline ?? string.Empty,
                IsActive = s.IsActive ?? false,
                IsOpenNow = s.IsOpenNow ?? false,
                Rating = s.Rating ?? 0,
                Latitude = s.Latitude.HasValue ? (decimal?)s.Latitude.Value : null,
                Longitude = s.Longitude.HasValue ? (decimal?)s.Longitude.Value : null,
                OwnerId = s.OwnerId ?? 0,
                ImageUrls = _context.MediaMappings
                    .Where(mm => mm.EntityType == "Store" && mm.EntityId == s.StoreId)
                    .OrderBy(mm => mm.DisplayOrder)
                    .Select(mm => mm.Media.FilePath)
                    .ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateStoreAsync(CreateStoreDto dto, int ownerId)
    {
        var store = new Store
        {
            StoreName = dto.StoreName,
            Address = dto.Address,
            Hotline = dto.Hotline,
            IsActive = true,
            IsOpenNow = false,
            Rating = 0,
            Latitude = dto.Latitude.HasValue ? (double?)dto.Latitude.Value : null,
            Longitude = dto.Longitude.HasValue ? (double?)dto.Longitude.Value : null,
            OwnerId = ownerId,
            CreatedAt = DateTime.Now
        };

        _context.Stores.Add(store);
        await _context.SaveChangesAsync();
        
        return store.StoreId;
    }

    public async Task<bool> UpdateStoreAsync(int storeId, UpdateStoreDto dto, int ownerId)
    {
        var store = await _context.Stores
            .FirstOrDefaultAsync(s => s.StoreId == storeId && s.OwnerId == ownerId);

        if (store == null)
            return false;

        store.StoreName = dto.StoreName;
        store.Address = dto.Address;
        store.Hotline = dto.Hotline;
        store.Latitude = dto.Latitude.HasValue ? (double?)dto.Latitude.Value : null;
        store.Longitude = dto.Longitude.HasValue ? (double?)dto.Longitude.Value : null;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteStoreAsync(int storeId, int ownerId)
    {
        var store = await _context.Stores
            .FirstOrDefaultAsync(s => s.StoreId == storeId && s.OwnerId == ownerId);

        if (store == null)
            return false;

        _context.Stores.Remove(store);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleStoreActiveAsync(int storeId, int ownerId)
    {
        var store = await _context.Stores
            .FirstOrDefaultAsync(s => s.StoreId == storeId && s.OwnerId == ownerId);

        if (store == null)
            return false;

        store.IsActive = !store.IsActive;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleStoreOpenAsync(int storeId, int ownerId)
    {
        var store = await _context.Stores
            .FirstOrDefaultAsync(s => s.StoreId == storeId && s.OwnerId == ownerId);

        if (store == null)
            return false;

        store.IsOpenNow = !store.IsOpenNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
