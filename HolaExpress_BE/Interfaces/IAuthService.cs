using HolaExpress_BE.DTOs.Auth;

namespace HolaExpress_BE.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
        Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
        string GenerateJwtToken(int userId, string email, string role);
        bool VerifyPassword(string password, string passwordHash);
        string HashPassword(string password);
        string GenerateVerificationToken(int userId, string email);
        Task<bool> VerifyEmailAsync(string token);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    }
}
