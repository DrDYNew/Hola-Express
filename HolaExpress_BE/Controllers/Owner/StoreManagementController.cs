using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.Interfaces.Owner;
using HolaExpress_BE.DTOs.Owner;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers.Owner;

[ApiController]
[Route("api/owner/stores")]
[Authorize(Roles = "OWNER")]
public class StoreManagementController : ControllerBase
{
    private readonly IStoreManagementService _storeService;
    private readonly ILogger<StoreManagementController> _logger;

    public StoreManagementController(
        IStoreManagementService storeService,
        ILogger<StoreManagementController> logger)
    {
        _storeService = storeService;
        _logger = logger;
    }

    private int GetOwnerIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID");
        }
        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnerStores()
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var stores = await _storeService.GetOwnerStoresAsync(ownerId);
            return Ok(stores);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting owner stores");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{storeId}")]
    public async Task<IActionResult> GetStoreById(int storeId)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var store = await _storeService.GetStoreByIdAsync(storeId, ownerId);
            
            if (store == null)
            {
                return NotFound(new { message = "Store not found" });
            }
            
            return Ok(store);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting store by ID {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateStore([FromBody] CreateStoreDto dto)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var storeId = await _storeService.CreateStoreAsync(dto, ownerId);
            var store = await _storeService.GetStoreByIdAsync(storeId, ownerId);
            
            return CreatedAtAction(nameof(GetStoreById), new { storeId }, store);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating store");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{storeId}")]
    public async Task<IActionResult> UpdateStore(int storeId, [FromBody] UpdateStoreDto dto)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var success = await _storeService.UpdateStoreAsync(storeId, dto, ownerId);
            
            if (!success)
            {
                return NotFound(new { message = "Store not found or you don't have permission" });
            }
            
            return Ok(new { message = "Store updated successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating store {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{storeId}")]
    public async Task<IActionResult> DeleteStore(int storeId)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var success = await _storeService.DeleteStoreAsync(storeId, ownerId);
            
            if (!success)
            {
                return NotFound(new { message = "Store not found or you don't have permission" });
            }
            
            return Ok(new { message = "Store deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting store {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPatch("{storeId}/toggle-active")]
    public async Task<IActionResult> ToggleStoreActive(int storeId)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var success = await _storeService.ToggleStoreActiveAsync(storeId, ownerId);
            
            if (!success)
            {
                return NotFound(new { message = "Store not found or you don't have permission" });
            }
            
            return Ok(new { message = "Store active status toggled successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling store active status {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPatch("{storeId}/toggle-open")]
    public async Task<IActionResult> ToggleStoreOpen(int storeId)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var success = await _storeService.ToggleStoreOpenAsync(storeId, ownerId);
            
            if (!success)
            {
                return NotFound(new { message = "Store not found or you don't have permission" });
            }
            
            return Ok(new { message = "Store open status toggled successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling store open status {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{storeId}/images")]
    public async Task<IActionResult> UploadStoreImages(int storeId, [FromForm] List<IFormFile> images)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            
            // Verify store ownership
            var store = await _storeService.GetStoreByIdAsync(storeId, ownerId);
            if (store == null)
            {
                return NotFound(new { message = "Store not found or you don't have permission" });
            }

            if (images == null || images.Count == 0)
            {
                return BadRequest(new { message = "No images provided" });
            }

            var uploadedUrls = await _storeService.UploadStoreImagesAsync(storeId, images, ownerId);
            
            return Ok(new { message = "Images uploaded successfully", imageUrls = uploadedUrls });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for store {StoreId}", storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{storeId}/images/{mediaId}")]
    public async Task<IActionResult> DeleteStoreImage(int storeId, int mediaId)
    {
        try
        {
            var ownerId = GetOwnerIdFromClaims();
            var success = await _storeService.DeleteStoreImageAsync(storeId, mediaId, ownerId);
            
            if (!success)
            {
                return NotFound(new { message = "Image not found or you don't have permission" });
            }
            
            return Ok(new { message = "Image deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {MediaId} for store {StoreId}", mediaId, storeId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
