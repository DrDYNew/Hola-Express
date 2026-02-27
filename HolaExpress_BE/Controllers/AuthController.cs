using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Auth;
using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Đăng nhập bằng email/số điện thoại và password
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var result = await _authService.LoginAsync(request);

                return Ok(new
                {
                    success = true,
                    message = "Đăng nhập thành công",
                    data = result
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Login failed for: {Email}. Reason: {Reason}", request.Email, ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for: {Email}", request.Email);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Đã xảy ra lỗi trong quá trình đăng nhập"
                });
            }
        }

        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var result = await _authService.RegisterAsync(request);

                return Ok(new
                {
                    success = true,
                    message = "Đăng ký thành công",
                    data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Registration failed for: {Email}. Reason: {Reason}", request.Email, ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for: {Email}", request.Email);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Đã xảy ra lỗi trong quá trình đăng ký"
                });
            }
        }

        /// <summary>
        /// Xác thực email qua verification token
        /// </summary>
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Token không hợp lệ"
                    });
                }

                var result = await _authService.VerifyEmailAsync(token);

                if (result)
                {
                    // Redirect đến trang success hoặc trả về HTML
                    return Content(@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác thực thành công - Hola Express</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .success-icon {
            font-size: 80px;
            color: #10B981;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 15px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: #FF6B6B;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: background 0.3s;
        }
        .button:hover {
            background: #FF5252;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='success-icon'>✓</div>
        <h1>Xác thực thành công!</h1>
        <p>Tài khoản của bạn đã được kích hoạt. Bạn có thể đóng trang này và bắt đầu sử dụng <strong>Hola Express</strong>.</p>
        <p>Chúc bạn có trải nghiệm tuyệt vời! 🍕</p>
    </div>
</body>
</html>", "text/html");
                }
                else
                {
                    // Token không hợp lệ hoặc đã hết hạn
                    return Content(@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác thực thất bại - Hola Express</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .error-icon {
            font-size: 80px;
            color: #EF4444;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 15px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='error-icon'>✗</div>
        <h1>Xác thực thất bại</h1>
        <p>Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.</p>
    </div>
</body>
</html>", "text/html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Đã xảy ra lỗi trong quá trình xác thực email"
                });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Dữ liệu không hợp lệ",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Không xác thực được người dùng" });
                }

                await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);

                return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi khi đổi mật khẩu" });
            }
        }
    }
}
