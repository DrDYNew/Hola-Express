using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using HolaExpress_BE.DTOs.Auth;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using BCrypt.Net;

namespace HolaExpress_BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
        {
            // Kiểm tra user tồn tại (có thể dùng email hoặc phone number)
            var user = await _userRepository.GetByEmailOrPhoneAsync(request.Email);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Email/Số điện thoại hoặc mật khẩu không đúng");
            }

            // Kiểm tra password
            if (string.IsNullOrEmpty(user.PasswordHash) || !VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Email/Số điện thoại hoặc mật khẩu không đúng");
            }

            // Kiểm tra tài khoản có bị khóa không
            if (user.Status == "INACTIVE")
            {
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa");
            }

            // Tạo JWT token
            var token = GenerateJwtToken(user.UserId, user.Email ?? user.PhoneNumber, user.Role ?? "USER");

            return new LoginResponseDto
            {
                UserId = user.UserId,
                Email = user.Email ?? user.PhoneNumber,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role ?? "USER",
                Token = token
            };
        }

        public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            // Kiểm tra email đã tồn tại
            if (!string.IsNullOrEmpty(request.Email))
            {
                var existingEmail = await _userRepository.EmailExistsAsync(request.Email);
                if (existingEmail)
                {
                    throw new InvalidOperationException("Email đã được sử dụng");
                }
            }

            // Kiểm tra số điện thoại đã tồn tại
            var existingPhone = await _userRepository.PhoneExistsAsync(request.PhoneNumber);
            if (existingPhone)
            {
                throw new InvalidOperationException("Số điện thoại đã được sử dụng");
            }

            // Hash password
            var passwordHash = HashPassword(request.Password);

            // Tạo user mới
            var newUser = new User
            {
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Role = "USER",
                Status = "ACTIVE",
                CreatedAt = DateTime.Now
            };

            await _userRepository.CreateAsync(newUser);

            // Tạo JWT token
            var token = GenerateJwtToken(newUser.UserId, newUser.Email ?? newUser.PhoneNumber, newUser.Role ?? "USER");

            return new LoginResponseDto
            {
                UserId = newUser.UserId,
                Email = newUser.Email ?? newUser.PhoneNumber,
                FullName = newUser.FullName,
                AvatarUrl = newUser.AvatarUrl,
                Role = newUser.Role ?? "USER",
                Token = token
            };
        }

        public string GenerateJwtToken(int userId, string email, string role)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            var issuer = jwtSettings["Issuer"] ?? "HolaExpress";
            var audience = jwtSettings["Audience"] ?? "HolaExpressApp";
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "1440");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, passwordHash);
            }
            catch
            {
                return false;
            }
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
