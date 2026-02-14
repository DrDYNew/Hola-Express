using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Services.Owner;

public class StoreManagementService : IStoreManagementService
{
    private readonly IStoreManagementRepository _repository;
    private readonly ILogger<StoreManagementService> _logger;
    private readonly HolaExpressContext _context;
    private readonly ICloudinaryService _cloudinaryService;

    public StoreManagementService(
        IStoreManagementRepository repository,
        ILogger<StoreManagementService> logger,
        HolaExpressContext context,
        ICloudinaryService cloudinaryService)
    {
        _repository = repository;
        _logger = logger;
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<IEnumerable<StoreDto>> GetOwnerStoresAsync(int ownerId)
    {
        return await _repository.GetOwnerStoresAsync(ownerId);
    }

    public async Task<StoreDto?> GetStoreByIdAsync(int storeId, int ownerId)
    {
        return await _repository.GetStoreByIdAsync(storeId, ownerId);
    }

    public async Task<int> CreateStoreAsync(CreateStoreDto dto, int ownerId)
    {
        return await _repository.CreateStoreAsync(dto, ownerId);
    }

    public async Task<bool> UpdateStoreAsync(int storeId, UpdateStoreDto dto, int ownerId)
    {
        return await _repository.UpdateStoreAsync(storeId, dto, ownerId);
    }

    public async Task<bool> DeleteStoreAsync(int storeId, int ownerId)
    {
        return await _repository.DeleteStoreAsync(storeId, ownerId);
    }

    public async Task<bool> ToggleStoreActiveAsync(int storeId, int ownerId)
    {
        return await _repository.ToggleStoreActiveAsync(storeId, ownerId);
    }

    public async Task<bool> ToggleStoreOpenAsync(int storeId, int ownerId)
    {
        return await _repository.ToggleStoreOpenAsync(storeId, ownerId);
    }

    public async Task<List<string>> UploadStoreImagesAsync(int storeId, List<IFormFile> images, int ownerId)
    {
        var uploadedUrls = new List<string>();
        
        // Get current max display order
        var maxDisplayOrder = await _context.MediaMappings
            .Where(mm => mm.EntityType == "Store" && mm.EntityId == storeId)
            .MaxAsync(mm => (int?)mm.DisplayOrder) ?? 0;

        foreach (var image in images)
        {
            if (image.Length > 0)
            {
                try
                {
                    // Upload to Cloudinary
                    var imageUrl = await _cloudinaryService.UploadImageAsync(image, "holaexpress/stores");

                    // Extract public ID from URL for future deletion
                    var publicId = ExtractPublicIdFromUrl(imageUrl);

                    // Create Media record
                    var media = new Media
                    {
                        FileName = publicId,
                        OriginalFileName = image.FileName,
                        FilePath = imageUrl,
                        FileSize = image.Length,
                        FileType = "image",
                        MimeType = image.ContentType,
                        UploadedByUserId = ownerId,
                        UploadDate = DateTime.Now,
                        IsActive = true
                    };
                    
                    _context.Medias.Add(media);
                    await _context.SaveChangesAsync();

                    // Create MediaMapping
                    maxDisplayOrder++;
                    var mapping = new MediaMapping
                    {
                        MediaId = media.MediaId,
                        EntityType = "Store",
                        EntityId = storeId,
                        MediaType = "image",
                        DisplayOrder = maxDisplayOrder,
                        CreatedDate = DateTime.Now
                    };
                    
                    _context.MediaMappings.Add(mapping);
                    await _context.SaveChangesAsync();

                    uploadedUrls.Add(imageUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error uploading image {image.FileName} to Cloudinary");
                    // Continue with other images
                }
            }
        }

        return uploadedUrls;
    }

    private string ExtractPublicIdFromUrl(string url)
    {
        // Extract public ID from Cloudinary URL
        // Example: https://res.cloudinary.com/dnyurlaq7/image/upload/v1234567890/holaexpress/stores/abc123.jpg
        // Public ID: holaexpress/stores/abc123
        var uri = new Uri(url);
        var segments = uri.Segments;
        
        // Find the upload segment
        var uploadIndex = Array.FindIndex(segments, s => s.Contains("upload"));
        if (uploadIndex >= 0 && uploadIndex + 2 < segments.Length)
        {
            // Skip version segment (v1234567890)
            var pathSegments = segments.Skip(uploadIndex + 2).Select(s => s.TrimEnd('/'));
            var publicId = string.Join("/", pathSegments);
            
            // Remove file extension
            var lastDot = publicId.LastIndexOf('.');
            if (lastDot > 0)
            {
                publicId = publicId.Substring(0, lastDot);
            }
            
            return publicId;
        }

        return Path.GetFileNameWithoutExtension(url);
    }

    public async Task<bool> DeleteStoreImageAsync(int storeId, int mediaId, int ownerId)
    {
        // Verify ownership
        var store = await _repository.GetStoreByIdAsync(storeId, ownerId);
        if (store == null)
        {
            return false;
        }

        var mapping = await _context.MediaMappings
            .FirstOrDefaultAsync(mm => mm.MediaId == mediaId && 
                                      mm.EntityType == "Store" && 
                                      mm.EntityId == storeId);
        
        if (mapping == null)
        {
            return false;
        }

        var media = await _context.Medias.FindAsync(mediaId);
        if (media != null)
        {
            try
            {
                // Delete from Cloudinary using public ID stored in FileName
                await _cloudinaryService.DeleteImageAsync(media.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting image from Cloudinary: {media.FileName}");
            }

            _context.MediaMappings.Remove(mapping);
            _context.Medias.Remove(media);
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
