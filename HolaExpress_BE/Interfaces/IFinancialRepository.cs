using HolaExpress_BE.DTOs.Admin;

namespace HolaExpress_BE.Interfaces
{
    public interface IFinancialRepository
    {
        Task<List<FeeConfigDto>> GetFeeConfigsAsync();
        Task<bool> UpdateFeeConfigAsync(string feeType, decimal value, bool isActive);
        Task<RevenueStatsDto> GetRevenueStatsAsync(DateTime startDate, DateTime endDate);
        Task<List<ReconciliationItemDto>> GetStoreReconciliationsAsync(string? status);
        Task<List<ReconciliationItemDto>> GetShipperReconciliationsAsync(string? status);
        Task<bool> UpdateStoreReconciliationStatusAsync(int id, string status, string? adminNote);
        Task<bool> UpdateShipperReconciliationStatusAsync(int id, string status, string? adminNote);
        Task<List<RefundRequestDto>> GetRefundRequestsAsync(string? status);
        Task<bool> UpdateRefundStatusAsync(int refundId, string status, string adminNote);
    }
}
