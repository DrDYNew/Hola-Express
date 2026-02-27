using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;
using HolaExpress_BE.Models;

namespace HolaExpress_BE.Repositories.Admin
{
    public class AdminRoleApplicationRepository : IAdminRoleApplicationRepository
    {
        private readonly HolaExpressContext _context;

        public AdminRoleApplicationRepository(HolaExpressContext context)
        {
            _context = context;
        }

        public async Task<(List<RoleApplication> Items, int Total)> GetApplicationsAsync(AdminRoleApplicationFilterDto filter)
        {
            var query = _context.RoleApplications
                .Include(ra => ra.User)
                .Include(ra => ra.ProcessedByUser)
                .AsQueryable();

            // Filter theo status
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(ra => ra.Status == filter.Status.ToUpper());

            // Filter theo loại vai trò (SHIPPER / OWNER)
            if (!string.IsNullOrWhiteSpace(filter.RequestedRole))
                query = query.Where(ra => ra.RequestedRole == filter.RequestedRole.ToUpper());

            // Search theo tên hoặc số điện thoại người đăng ký
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var keyword = filter.Search.Trim().ToLower();
                query = query.Where(ra =>
                    ra.User.FullName.ToLower().Contains(keyword) ||
                    ra.User.PhoneNumber.Contains(keyword) ||
                    (ra.User.Email != null && ra.User.Email.ToLower().Contains(keyword)));
            }

            // Filter theo khoảng ngày
            if (filter.FromDate.HasValue)
                query = query.Where(ra => ra.ApplicationDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(ra => ra.ApplicationDate <= filter.ToDate.Value.AddDays(1).AddTicks(-1));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(ra => ra.ApplicationDate)
                .Skip((filter.Page - 1) * filter.Limit)
                .Take(filter.Limit)
                .ToListAsync();

            return (items, total);
        }

        public async Task<RoleApplication?> GetApplicationDetailAsync(int applicationId)
        {
            return await _context.RoleApplications
                .Include(ra => ra.User)
                .Include(ra => ra.ProcessedByUser)
                .Include(ra => ra.IdCardFrontMedia)
                .Include(ra => ra.IdCardBackMedia)
                .Include(ra => ra.LicenseFrontMedia)
                .Include(ra => ra.LicenseBackMedia)
                .Include(ra => ra.BusinessLicenseMedia)
                .Include(ra => ra.TaxCodeMedia)
                .FirstOrDefaultAsync(ra => ra.ApplicationId == applicationId);
        }

        public async Task<bool> UpdateApplicationStatusAsync(int applicationId, string status, int adminId,
            string? adminNotes, string? rejectionReason)
        {
            var application = await _context.RoleApplications
                .Include(ra => ra.User)
                .FirstOrDefaultAsync(ra => ra.ApplicationId == applicationId);

            if (application == null) return false;

            application.Status = status.ToUpper();
            application.AdminNotes = adminNotes;
            application.RejectionReason = status.ToUpper() == "REJECTED" ? rejectionReason : null;
            application.ProcessedDate = DateTime.Now;
            application.ProcessedBy = adminId;
            application.UpdatedAt = DateTime.Now;

            // Nếu duyệt thì cập nhật role của user
            if (status.ToUpper() == "APPROVED")
            {
                var user = application.User;
                user.Role = application.RequestedRole;

                // Nếu là SHIPPER thì tạo shipper profile nếu chưa có
                if (application.RequestedRole == "SHIPPER")
                {
                    var existingProfile = await _context.ShipperProfiles
                        .FirstOrDefaultAsync(sp => sp.UserId == user.UserId);

                    if (existingProfile == null)
                    {
                        _context.ShipperProfiles.Add(new ShipperProfile
                        {
                            UserId = user.UserId,
                            LicenseNumber = application.LicenseNumber,
                            VehiclePlate = application.VehiclePlate,
                            VehicleType = application.VehicleType,
                            IsOnline = false
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Dictionary<string, int>> GetApplicationCountByStatusAsync()
        {
            var result = await _context.RoleApplications
                .GroupBy(ra => ra.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return result.ToDictionary(x => x.Status, x => x.Count);
        }
    }
}
