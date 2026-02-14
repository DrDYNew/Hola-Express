using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.DTOs.Address;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly IAddressService _addressService;
    private readonly ILogger<AddressController> _logger;

    public AddressController(IAddressService addressService, ILogger<AddressController> logger)
    {
        _addressService = addressService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // GET: api/Address
    [HttpGet]
    public async Task<ActionResult> GetUserAddresses()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var addresses = await _addressService.GetUserAddressesAsync(userId);
            return Ok(new { success = true, data = addresses });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user addresses");
            return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách địa chỉ" });
        }
    }

    // GET: api/Address/5
    [HttpGet("{id}")]
    public async Task<ActionResult> GetAddress(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var address = await _addressService.GetAddressByIdAsync(userId, id);

            if (address == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
            }

            return Ok(new { success = true, data = address });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting address");
            return StatusCode(500, new { success = false, message = "Lỗi khi lấy thông tin địa chỉ" });
        }
    }

    // POST: api/Address
    [HttpPost]
    public async Task<ActionResult> CreateAddress([FromBody] CreateAddressDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var address = await _addressService.CreateAddressAsync(userId, dto);
            return Ok(new { success = true, data = address, message = "Đã thêm địa chỉ mới" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating address");
            return StatusCode(500, new { success = false, message = "Lỗi khi thêm địa chỉ" });
        }
    }

    // PUT: api/Address/5
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateAddress(int id, [FromBody] UpdateAddressDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var address = await _addressService.UpdateAddressAsync(userId, id, dto);

            if (address == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
            }

            return Ok(new { success = true, data = address, message = "Đã cập nhật địa chỉ" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating address");
            return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật địa chỉ" });
        }
    }

    // DELETE: api/Address/5
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAddress(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var deleted = await _addressService.DeleteAddressAsync(userId, id);

            if (!deleted)
            {
                return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
            }

            return Ok(new { success = true, message = "Đã xóa địa chỉ" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting address");
            return StatusCode(500, new { success = false, message = "Lỗi khi xóa địa chỉ" });
        }
    }

    // PATCH: api/Address/5/set-default
    [HttpPatch("{id}/set-default")]
    public async Task<ActionResult> SetDefaultAddress(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không xác thực được người dùng" });
            }

            var success = await _addressService.SetDefaultAddressAsync(userId, id);

            if (!success)
            {
                return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });
            }

            return Ok(new { success = true, message = "Đã đặt địa chỉ mặc định" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default address");
            return StatusCode(500, new { success = false, message = "Lỗi khi đặt địa chỉ mặc định" });
        }
    }
}
