using HolaExpress_BE.DTOs.Owner;
using Microsoft.AspNetCore.Http;

namespace HolaExpress_BE.Interfaces.Owner;

public interface IStoreManagementService
{
    Task<IEnumerable<StoreDto>> GetOwnerStoresAsync(int ownerId);
    Task<StoreDto?> GetStoreByIdAsync(int storeId, int ownerId);
    Task<int> CreateStoreAsync(CreateStoreDto dto, int ownerId);
    Task<bool> UpdateStoreAsync(int storeId, UpdateStoreDto dto, int ownerId);
    Task<bool> DeleteStoreAsync(int storeId, int ownerId);
    Task<bool> ToggleStoreActiveAsync(int storeId, int ownerId);
    Task<bool> ToggleStoreOpenAsync(int storeId, int ownerId);
    Task<List<string>> UploadStoreImagesAsync(int storeId, List<IFormFile> images, int ownerId);
    Task<bool> DeleteStoreImageAsync(int storeId, int mediaId, int ownerId);
}
