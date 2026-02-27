namespace HolaExpress_BE.DTOs.Auth
{
    public class LoginResponseDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public string Role { get; set; } = "USER";
        public string Token { get; set; } = string.Empty;
    }
}
