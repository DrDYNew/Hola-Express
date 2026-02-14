using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces.Admin
{
    public interface IFinancialService
    {
        // Fee Configuration
        Task<List<FeeConfigDto>> GetFeeConfigsAsync();
        Task<bool> UpdateFeeConfigAsync(string feeType, UpdateFeeConfigDto dto);

        // Revenue Statistics
        Task<RevenueStatsDto> GetRevenueStatsAsync(RevenueQueryDto query);

        // Reconciliation
        Task<List<ReconciliationItemDto>> GetReconciliationsAsync(string type, string? status = null);
        Task<bool> UpdateReconciliationStatusAsync(int id, string type, UpdateReconciliationStatusDto dto);

        // Refund Management
        Task<List<RefundRequestDto>> GetRefundRequestsAsync(string? status = null);
        Task<bool> ProcessRefundAsync(int refundId, ProcessRefundDto dto);
    }
}
