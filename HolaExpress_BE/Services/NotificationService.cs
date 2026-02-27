using HolaExpress_BE.DTOs.Notification;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Services;

public class NotificationService : INotificationService
{
    private readonly HolaExpressContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(HolaExpressContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendAsync(int userId, string title, string message, string type)
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.Now
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving notification for user {UserId}", userId);
        }
    }

    public async Task<List<NotificationDto>> GetByUserAsync(int userId, int page = 1, int pageSize = 20)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                NotiId = n.NotiId,
                Title = n.Title ?? "",
                Message = n.Message ?? "",
                Type = n.Type ?? "GENERAL",
                IsRead = n.IsRead ?? false,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && n.IsRead == false);
    }

    public async Task MarkReadAsync(int notificationId, int userId)
    {
        var noti = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotiId == notificationId && n.UserId == userId);
        if (noti != null)
        {
            noti.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var notis = await _context.Notifications
            .Where(n => n.UserId == userId && n.IsRead == false)
            .ToListAsync();

        foreach (var n in notis)
            n.IsRead = true;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int notificationId, int userId)
    {
        var noti = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotiId == notificationId && n.UserId == userId);
        if (noti != null)
        {
            _context.Notifications.Remove(noti);
            await _context.SaveChangesAsync();
        }
    }
}
