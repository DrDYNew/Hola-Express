using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IRoleApplicationRepository
{
    Task<RoleApplication> CreateAsync(RoleApplication application);
    Task<RoleApplication?> GetByIdAsync(int applicationId);
    Task<List<RoleApplication>> GetByUserIdAsync(int userId);
    Task<List<RoleApplication>> GetAllPendingAsync();
    Task<List<RoleApplication>> GetAllByStatusAsync(string status);
    Task<RoleApplication?> GetPendingApplicationByUserAndRoleAsync(int userId, string requestedRole);
    Task UpdateAsync(RoleApplication application);
    Task SaveChangesAsync();
}
