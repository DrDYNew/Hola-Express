using HolaExpress_BE.DTOs.RoleApplication;

namespace HolaExpress_BE.Interfaces;

public interface IRoleApplicationService
{
    Task<RoleApplicationResponseDto> ApplyForShipperAsync(int userId, ApplyForShipperDto dto);
    Task<RoleApplicationResponseDto> ApplyForOwnerAsync(int userId, ApplyForOwnerDto dto);
    Task<RoleApplicationResponseDto> GetApplicationByIdAsync(int applicationId);
    Task<List<RoleApplicationResponseDto>> GetUserApplicationsAsync(int userId);
    Task<List<RoleApplicationResponseDto>> GetAllPendingApplicationsAsync();
    Task<List<RoleApplicationResponseDto>> GetApplicationsByStatusAsync(string status);
    Task<RoleApplicationResponseDto> ProcessApplicationAsync(int adminId, ProcessApplicationDto dto);
}
