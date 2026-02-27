using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly HolaExpressContext _context;
    private readonly ILogger<MediaController> _logger;

    public MediaController(
        ICloudinaryService cloudinaryService,
        HolaExpressContext context,
        ILogger<MediaController> logger)
    {
        _cloudinaryService = cloudinaryService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Upload ảnh giấy tờ (CMND, Bằng lái, Giấy phép KD...)
    /// </summary>
    [HttpPost("upload-document")]
    public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] string documentType = "document")
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn file để upload" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được người dùng" });
            }

            // Upload lên Cloudinary
            var folderName = $"documents/{documentType}";
            var imageUrl = await _cloudinaryService.UploadImageAsync(file, folderName);

            // Lưu vào bảng Media
            var media = new Media
            {
                FileName = Path.GetFileNameWithoutExtension(file.FileName),
                OriginalFileName = file.FileName,
                FilePath = imageUrl,
                FileSize = file.Length,
                FileType = "image",
                MimeType = file.ContentType,
                UploadedByUserId = userId,
                UploadDate = DateTime.Now,
                IsActive = true
            };

            _context.Medias.Add(media);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} uploaded document: {FileName} (MediaId: {MediaId})", 
                userId, file.FileName, media.MediaId);

            return Ok(new
            {
                success = true,
                message = "Upload ảnh thành công",
                data = new
                {
                    mediaId = media.MediaId,
                    fileName = media.FileName,
                    fileUrl = media.FilePath,
                    fileSize = media.FileSize,
                    uploadDate = media.UploadDate
                }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Upload validation failed: {Message}", ex.Message);
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi khi upload ảnh"
            });
        }
    }

    /// <summary>
    /// Upload nhiều ảnh cùng lúc
    /// </summary>
    [HttpPost("upload-multiple")]
    public async Task<IActionResult> UploadMultiple([FromForm] List<IFormFile> files, [FromForm] string documentType = "document")
    {
        try
        {
            if (files == null || !files.Any())
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn ít nhất 1 file để upload" });
            }

            if (files.Count > 10)
            {
                return BadRequest(new { success = false, message = "Chỉ được upload tối đa 10 ảnh" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "Không xác định được người dùng" });
            }

            var uploadedMedia = new List<object>();
            var folderName = $"documents/{documentType}";

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadImageAsync(file, folderName);

                    var media = new Media
                    {
                        FileName = Path.GetFileNameWithoutExtension(file.FileName),
                        OriginalFileName = file.FileName,
                        FilePath = imageUrl,
                        FileSize = file.Length,
                        FileType = "image",
                        MimeType = file.ContentType,
                        UploadedByUserId = userId,
                        UploadDate = DateTime.Now,
                        IsActive = true
                    };

                    _context.Medias.Add(media);
                    await _context.SaveChangesAsync();

                    uploadedMedia.Add(new
                    {
                        mediaId = media.MediaId,
                        fileName = media.FileName,
                        fileUrl = media.FilePath,
                        fileSize = media.FileSize,
                        uploadDate = media.UploadDate
                    });
                }
            }

            _logger.LogInformation("User {UserId} uploaded {Count} documents", userId, uploadedMedia.Count);

            return Ok(new
            {
                success = true,
                message = $"Upload thành công {uploadedMedia.Count} ảnh",
                data = uploadedMedia
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading multiple documents");
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi khi upload ảnh"
            });
        }
    }

    /// <summary>
    /// Lấy thông tin media theo ID
    /// </summary>
    [HttpGet("{mediaId}")]
    public async Task<IActionResult> GetMediaById(int mediaId)
    {
        try
        {
            var media = await _context.Medias.FindAsync(mediaId);
            
            if (media == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy media" });
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    mediaId = media.MediaId,
                    fileName = media.FileName,
                    fileUrl = media.FilePath,
                    fileSize = media.FileSize,
                    fileType = media.FileType,
                    uploadDate = media.UploadDate
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting media {MediaId}", mediaId);
            return StatusCode(500, new
            {
                success = false,
                message = "Đã xảy ra lỗi"
            });
        }
    }
}
