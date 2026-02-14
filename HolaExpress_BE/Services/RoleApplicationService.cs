using HolaExpress_BE.DTOs.RoleApplication;
using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Services;

public class RoleApplicationService : IRoleApplicationService
{
    private readonly IRoleApplicationRepository _roleApplicationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IShipperRepository _shipperRepository;
    private readonly ILogger<RoleApplicationService> _logger;

    public RoleApplicationService(
        IRoleApplicationRepository roleApplicationRepository,
        IUserRepository userRepository,
        IShipperRepository shipperRepository,
        ILogger<RoleApplicationService> logger)
    {
        _roleApplicationRepository = roleApplicationRepository;
        _userRepository = userRepository;
        _shipperRepository = shipperRepository;
        _logger = logger;
    }

    public async Task<RoleApplicationResponseDto> ApplyForShipperAsync(int userId, ApplyForShipperDto dto)
    {
        // Kiểm tra user tồn tại
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Người dùng không tồn tại");
        }

        // Kiểm tra user đã là shipper chưa
        if (user.Role == "SHIPPER")
        {
            throw new InvalidOperationException("Bạn đã là shipper rồi");
        }

        // Kiểm tra đã có đơn đăng ký pending chưa
        var pendingApplication = await _roleApplicationRepository
            .GetPendingApplicationByUserAndRoleAsync(userId, "SHIPPER");
        
        if (pendingApplication != null)
        {
            throw new InvalidOperationException("Bạn đã có đơn đăng ký làm shipper đang chờ xử lý");
        }

        // Tạo đơn đăng ký mới
        var application = new RoleApplication
        {
            UserId = userId,
            RequestedRole = "SHIPPER",
            Status = "PENDING",
            LicenseNumber = dto.LicenseNumber,
            VehiclePlate = dto.VehiclePlate,
            VehicleType = dto.VehicleType,
            VehicleTypeOther = dto.VehicleTypeOther,
            Notes = dto.Notes,
            IdCardFrontMediaId = dto.IdCardFrontMediaId,
            IdCardBackMediaId = dto.IdCardBackMediaId,
            LicenseFrontMediaId = dto.LicenseFrontMediaId,
            LicenseBackMediaId = dto.LicenseBackMediaId,
            ApplicationDate = DateTime.Now,
            CreatedAt = DateTime.Now
        };

        var createdApplication = await _roleApplicationRepository.CreateAsync(application);
        
        _logger.LogInformation("User {UserId} applied for SHIPPER role", userId);

        return MapToResponseDto(createdApplication);
    }

    public async Task<RoleApplicationResponseDto> ApplyForOwnerAsync(int userId, ApplyForOwnerDto dto)
    {
        // Kiểm tra user tồn tại
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Người dùng không tồn tại");
        }

        // Kiểm tra user đã là owner chưa
        if (user.Role == "OWNER")
        {
            throw new InvalidOperationException("Bạn đã là chủ quán rồi");
        }

        // Kiểm tra đã có đơn đăng ký pending chưa
        var pendingApplication = await _roleApplicationRepository
            .GetPendingApplicationByUserAndRoleAsync(userId, "OWNER");
        
        if (pendingApplication != null)
        {
            throw new InvalidOperationException("Bạn đã có đơn đăng ký làm chủ quán đang chờ xử lý");
        }

        // Tạo đơn đăng ký mới
        var application = new RoleApplication
        {
            UserId = userId,
            RequestedRole = "OWNER",
            Status = "PENDING",
            BusinessName = dto.BusinessName,
            BusinessAddress = dto.BusinessAddress,
            BusinessLicense = dto.BusinessLicense,
            TaxCode = dto.TaxCode,
            Notes = dto.Notes,
            IdCardFrontMediaId = dto.IdCardFrontMediaId,
            IdCardBackMediaId = dto.IdCardBackMediaId,
            BusinessLicenseMediaId = dto.BusinessLicenseMediaId,
            TaxCodeMediaId = dto.TaxCodeMediaId,
            ApplicationDate = DateTime.Now,
            CreatedAt = DateTime.Now
        };

        var createdApplication = await _roleApplicationRepository.CreateAsync(application);
        
        _logger.LogInformation("User {UserId} applied for OWNER role", userId);

        return MapToResponseDto(createdApplication);
    }

    public async Task<RoleApplicationResponseDto> GetApplicationByIdAsync(int applicationId)
    {
        var application = await _roleApplicationRepository.GetByIdAsync(applicationId);
        if (application == null)
        {
            throw new InvalidOperationException("Không tìm thấy đơn đăng ký");
        }

        return MapToResponseDto(application);
    }

    public async Task<List<RoleApplicationResponseDto>> GetUserApplicationsAsync(int userId)
    {
        var applications = await _roleApplicationRepository.GetByUserIdAsync(userId);
        return applications.Select(MapToResponseDto).ToList();
    }

    public async Task<List<RoleApplicationResponseDto>> GetAllPendingApplicationsAsync()
    {
        var applications = await _roleApplicationRepository.GetAllPendingAsync();
        return applications.Select(MapToResponseDto).ToList();
    }

    public async Task<List<RoleApplicationResponseDto>> GetApplicationsByStatusAsync(string status)
    {
        var applications = await _roleApplicationRepository.GetAllByStatusAsync(status);
        return applications.Select(MapToResponseDto).ToList();
    }

    public async Task<RoleApplicationResponseDto> ProcessApplicationAsync(int adminId, ProcessApplicationDto dto)
    {
        // Kiểm tra admin tồn tại
        var admin = await _userRepository.GetByIdAsync(adminId);
        if (admin == null || admin.Role != "ADMIN")
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thực hiện hành động này");
        }

        // Lấy đơn đăng ký
        var application = await _roleApplicationRepository.GetByIdAsync(dto.ApplicationId);
        if (application == null)
        {
            throw new InvalidOperationException("Không tìm thấy đơn đăng ký");
        }

        // Kiểm tra trạng thái
        if (application.Status != "PENDING")
        {
            throw new InvalidOperationException($"Đơn đăng ký đã được xử lý rồi (Trạng thái: {application.Status})");
        }

        // Validate status
        if (dto.Status != "APPROVED" && dto.Status != "REJECTED")
        {
            throw new InvalidOperationException("Trạng thái phải là APPROVED hoặc REJECTED");
        }

        // Nếu từ chối, phải có lý do
        if (dto.Status == "REJECTED" && string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            throw new InvalidOperationException("Vui lòng cung cấp lý do từ chối");
        }

        // Cập nhật application
        application.Status = dto.Status;
        application.AdminNotes = dto.AdminNotes;
        application.RejectionReason = dto.RejectionReason;
        application.ProcessedDate = DateTime.Now;
        application.ProcessedBy = adminId;

        await _roleApplicationRepository.UpdateAsync(application);

        // Nếu approved, cập nhật role của user
        if (dto.Status == "APPROVED")
        {
            var user = await _userRepository.GetByIdAsync(application.UserId);
            if (user != null)
            {
                user.Role = application.RequestedRole;
                await _userRepository.UpdateAsync(user);

                // Nếu là shipper, tạo ShipperProfile
                if (application.RequestedRole == "SHIPPER")
                {
                    var shipperProfile = new ShipperProfile
                    {
                        UserId = user.UserId,
                        LicenseNumber = application.LicenseNumber,
                        VehiclePlate = application.VehiclePlate,
                        VehicleType = application.VehicleType,
                        IsOnline = false,
                        LastLocationUpdate = DateTime.Now
                    };

                    await _shipperRepository.CreateShipperProfileAsync(shipperProfile);
                }

                _logger.LogInformation("User {UserId} role updated to {Role} by admin {AdminId}", 
                    user.UserId, application.RequestedRole, adminId);
            }
        }

        _logger.LogInformation("Application {ApplicationId} processed as {Status} by admin {AdminId}", 
            dto.ApplicationId, dto.Status, adminId);

        // Reload to get updated data with navigation properties
        var updatedApplication = await _roleApplicationRepository.GetByIdAsync(dto.ApplicationId);
        return MapToResponseDto(updatedApplication!);
    }

    private RoleApplicationResponseDto MapToResponseDto(RoleApplication application)
    {
        return new RoleApplicationResponseDto
        {
            ApplicationId = application.ApplicationId,
            UserId = application.UserId,
            UserName = application.User?.FullName ?? "",
            RequestedRole = application.RequestedRole,
            Status = application.Status,
            LicenseNumber = application.LicenseNumber,
            VehiclePlate = application.VehiclePlate,
            VehicleType = application.VehicleType,
            VehicleTypeOther = application.VehicleTypeOther,
            BusinessName = application.BusinessName,
            BusinessAddress = application.BusinessAddress,
            BusinessLicense = application.BusinessLicense,
            TaxCode = application.TaxCode,
            Notes = application.Notes,
            AdminNotes = application.AdminNotes,
            RejectionReason = application.RejectionReason,
            IdCardFrontUrl = application.IdCardFrontMedia?.FilePath,
            IdCardBackUrl = application.IdCardBackMedia?.FilePath,
            LicenseFrontUrl = application.LicenseFrontMedia?.FilePath,
            LicenseBackUrl = application.LicenseBackMedia?.FilePath,
            BusinessLicenseDocumentUrl = application.BusinessLicenseMedia?.FilePath,
            TaxCodeDocumentUrl = application.TaxCodeMedia?.FilePath,
            ApplicationDate = application.ApplicationDate,
            ProcessedDate = application.ProcessedDate,
            ProcessedBy = application.ProcessedBy,
            ProcessedByName = application.ProcessedByUser?.FullName
        };
    }
}
