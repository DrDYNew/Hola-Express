using HolaExpress_BE.DTOs.Owner;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Services.Owner;

public class ProductManagementService : IProductManagementService
{
    private readonly IProductManagementRepository _repository;
    private readonly ILogger<ProductManagementService> _logger;
    private readonly HolaExpressContext _context;
    private readonly ICloudinaryService _cloudinaryService;

    public ProductManagementService(
        IProductManagementRepository repository,
        ILogger<ProductManagementService> logger,
        HolaExpressContext context,
        ICloudinaryService cloudinaryService)
    {
        _repository = repository;
        _logger = logger;
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<IEnumerable<ProductDto>> GetOwnerProductsAsync(int ownerId, int? storeId = null)
    {
        return await _repository.GetOwnerProductsAsync(ownerId, storeId);
    }

    public async Task<ProductDto?> GetProductByIdAsync(int productId, int ownerId)
    {
        return await _repository.GetProductByIdAsync(productId, ownerId);
    }

    public async Task<int> CreateProductAsync(CreateProductDto dto, int ownerId)
    {
        return await _repository.CreateProductAsync(dto, ownerId);
    }

    public async Task<bool> UpdateProductAsync(int productId, UpdateProductDto dto, int ownerId)
    {
        return await _repository.UpdateProductAsync(productId, dto, ownerId);
    }

    public async Task<bool> DeleteProductAsync(int productId, int ownerId)
    {
        return await _repository.DeleteProductAsync(productId, ownerId);
    }

    public async Task<bool> ToggleProductAvailableAsync(int productId, int ownerId)
    {
        return await _repository.ToggleProductAvailableAsync(productId, ownerId);
    }

    public async Task<bool> ToggleProductFeaturedAsync(int productId, int ownerId)
    {
        return await _repository.ToggleProductFeaturedAsync(productId, ownerId);
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        return await _repository.GetCategoriesAsync();
    }

    public async Task<int> CreateCategoryAsync(CreateCategoryDto dto)
    {
        return await _repository.CreateCategoryAsync(dto);
    }

    public async Task<IEnumerable<ToppingDto>> GetProductToppingsAsync(int productId, int ownerId)
    {
        return await _repository.GetProductToppingsAsync(productId, ownerId);
    }

    public async Task<int> CreateToppingAsync(int productId, CreateToppingDto dto, int ownerId)
    {
        return await _repository.CreateToppingAsync(productId, dto, ownerId);
    }

    public async Task<bool> UpdateToppingAsync(int productId, int toppingId, UpdateToppingDto dto, int ownerId)
    {
        return await _repository.UpdateToppingAsync(productId, toppingId, dto, ownerId);
    }

    public async Task<bool> DeleteToppingAsync(int productId, int toppingId, int ownerId)
    {
        return await _repository.DeleteToppingAsync(productId, toppingId, ownerId);
    }

    public async Task<List<string>> UploadProductImagesAsync(int productId, List<IFormFile> images, int ownerId)
    {
        var uploadedUrls = new List<string>();
        
        // Verify product ownership
        var product = await _repository.GetProductByIdAsync(productId, ownerId);
        if (product == null)
        {
            throw new UnauthorizedAccessException("Product not found or you don't have permission");
        }

        // Get current max display order
        var maxDisplayOrder = await _context.MediaMappings
            .Where(mm => mm.EntityType == "Product" && mm.EntityId == productId)
            .MaxAsync(mm => (int?)mm.DisplayOrder) ?? 0;

        foreach (var image in images)
        {
            if (image.Length > 0)
            {
                try
                {
                    // Upload to Cloudinary
                    var imageUrl = await _cloudinaryService.UploadImageAsync(image, "holaexpress/products");

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
                        EntityType = "Product",
                        EntityId = productId,
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
                }
            }
        }

        return uploadedUrls;
    }

    public async Task<bool> DeleteProductImageAsync(int productId, int mediaId, int ownerId)
    {
        // Verify ownership
        var product = await _repository.GetProductByIdAsync(productId, ownerId);
        if (product == null)
        {
            return false;
        }

        var mapping = await _context.MediaMappings
            .FirstOrDefaultAsync(mm => mm.MediaId == mediaId && 
                                      mm.EntityType == "Product" && 
                                      mm.EntityId == productId);
        
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

    private string ExtractPublicIdFromUrl(string url)
    {
        var uri = new Uri(url);
        var segments = uri.Segments;
        
        var uploadIndex = Array.FindIndex(segments, s => s.Contains("upload"));
        if (uploadIndex >= 0 && uploadIndex + 2 < segments.Length)
        {
            var pathSegments = segments.Skip(uploadIndex + 2).Select(s => s.TrimEnd('/'));
            var publicId = string.Join("/", pathSegments);
            
            var lastDot = publicId.LastIndexOf('.');
            if (lastDot > 0)
            {
                publicId = publicId.Substring(0, lastDot);
            }
            
            return publicId;
        }

        return Path.GetFileNameWithoutExtension(url);
    }
}
