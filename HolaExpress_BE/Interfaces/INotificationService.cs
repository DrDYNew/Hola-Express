using HolaExpress_BE.DTOs.Notification;

namespace HolaExpress_BE.Interfaces;

public interface INotificationService
{
    Task SendAsync(int userId, string title, string message, string type);
    Task<List<NotificationDto>> GetByUserAsync(int userId, int page = 1, int pageSize = 20);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkReadAsync(int notificationId, int userId);
    Task MarkAllReadAsync(int userId);
    Task DeleteAsync(int notificationId, int userId);
}
