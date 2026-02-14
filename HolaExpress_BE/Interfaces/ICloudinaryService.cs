using Microsoft.AspNetCore.Http;

namespace HolaExpress_BE.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder = "stores");
        Task<bool> DeleteImageAsync(string publicId);
    }
}
