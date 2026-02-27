using HolaExpress_BE.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int userId))
            throw new UnauthorizedAccessException("User not authenticated");
        return userId;
    }

    // GET /api/notification?page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var list = await _notificationService.GetByUserAsync(userId, page, pageSize);
        var unread = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { success = true, data = list, unreadCount = unread });
    }

    // GET /api/notification/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { success = true, data = count });
    }

    // PUT /api/notification/{id}/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = GetUserId();
        await _notificationService.MarkReadAsync(id, userId);
        return Ok(new { success = true });
    }

    // PUT /api/notification/read-all
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetUserId();
        await _notificationService.MarkAllReadAsync(userId);
        return Ok(new { success = true });
    }

    // DELETE /api/notification/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        await _notificationService.DeleteAsync(id, userId);
        return Ok(new { success = true });
    }
}
