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
        private readonly IEmailService _emailService;

        public AuthService(
            IUserRepository userRepository,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IEmailService emailService)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
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
            if (user.Status == "INACTIVE" || user.Status == "BANNED")
            {
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa");
            }

            // Kiểm tra tài khoản đã xác thực chưa
            if (user.IsVerified != true)
            {
                throw new UnauthorizedAccessException("Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.");
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
                Role = "CUSTOMER",
                Status = "ACTIVE",
                IsVerified = false,
                CreatedAt = DateTime.Now
            };

            await _userRepository.CreateAsync(newUser);

            // Gửi email verification (không block registration nếu email fail)
            try
            {
                var verificationToken = GenerateVerificationToken(newUser.UserId, newUser.Email ?? newUser.PhoneNumber);
                await _emailService.SendVerificationEmailAsync(
                    newUser.Email ?? "",
                    newUser.FullName ?? "",
                    verificationToken
                );
                _logger.LogInformation("Verification email sent to {Email}", newUser.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}", newUser.Email);
                // Không throw exception, cho phép user register thành công
            }

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

        public string GenerateVerificationToken(int userId, string email)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            var issuer = jwtSettings["Issuer"] ?? "HolaExpress";
            var audience = jwtSettings["Audience"] ?? "HolaExpressApp";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim("purpose", "email_verification"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24), // Token hết hạn sau 24 giờ
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<bool> VerifyEmailAsync(string token)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
                var issuer = jwtSettings["Issuer"] ?? "HolaExpress";
                var audience = jwtSettings["Audience"] ?? "HolaExpressApp";

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var tokenHandler = new JwtSecurityTokenHandler();

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                // Kiểm tra purpose claim
                var purposeClaim = principal.Claims.FirstOrDefault(c => c.Type == "purpose");
                if (purposeClaim == null || purposeClaim.Value != "email_verification")
                {
                    _logger.LogWarning("Invalid token purpose");
                    return false;
                }

                // Lấy userId từ token
                var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("Invalid userId in token");
                    return false;
                }

                // Cập nhật IsVerified cho user
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found: {UserId}", userId);
                    return false;
                }

                if (user.IsVerified == true)
                {
                    _logger.LogInformation("User already verified: {UserId}", userId);
                    return true; // Đã verify rồi
                }

                user.IsVerified = true;
                await _userRepository.UpdateAsync(user);

                // Gửi welcome email
                try
                {
                    await _emailService.SendWelcomeEmailAsync(
                        user.Email ?? "",
                        user.FullName ?? ""
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
                    // Không throw, vì verify đã thành công
                }

                _logger.LogInformation("User verified successfully: {UserId}", userId);
                return true;
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("Verification token expired");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email token");
                return false;
            }
        }
    }
}
