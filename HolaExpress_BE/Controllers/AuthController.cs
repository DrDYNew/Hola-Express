using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Auth;
using HolaExpress_BE.Interfaces;

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
    }
}
