using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class RoleApplicationRepository : IRoleApplicationRepository
{
    private readonly HolaExpressContext _context;

    public RoleApplicationRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<RoleApplication> CreateAsync(RoleApplication application)
    {
        _context.RoleApplications.Add(application);
        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<RoleApplication?> GetByIdAsync(int applicationId)
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

    public async Task<List<RoleApplication>> GetByUserIdAsync(int userId)
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
            .Where(ra => ra.UserId == userId)
            .OrderByDescending(ra => ra.ApplicationDate)
            .ToListAsync();
    }

    public async Task<List<RoleApplication>> GetAllPendingAsync()
    {
        return await _context.RoleApplications
            .Include(ra => ra.User)
            .Include(ra => ra.IdCardFrontMedia)
            .Include(ra => ra.IdCardBackMedia)
            .Include(ra => ra.LicenseFrontMedia)
            .Include(ra => ra.LicenseBackMedia)
            .Include(ra => ra.BusinessLicenseMedia)
            .Include(ra => ra.TaxCodeMedia)
            .Where(ra => ra.Status == "PENDING")
            .OrderBy(ra => ra.ApplicationDate)
            .ToListAsync();
    }

    public async Task<List<RoleApplication>> GetAllByStatusAsync(string status)
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
            .Where(ra => ra.Status == status)
            .OrderByDescending(ra => ra.ApplicationDate)
            .ToListAsync();
    }

    public async Task<RoleApplication?> GetPendingApplicationByUserAndRoleAsync(int userId, string requestedRole)
    {
        return await _context.RoleApplications
            .FirstOrDefaultAsync(ra => ra.UserId == userId 
                && ra.RequestedRole == requestedRole 
                && ra.Status == "PENDING");
    }

    public async Task UpdateAsync(RoleApplication application)
    {
        application.UpdatedAt = DateTime.Now;
        _context.RoleApplications.Update(application);
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
