using Microsoft.EntityFrameworkCore;
using HolaExpress_BE.Models;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Repositories
{
    public class FinancialRepository : IFinancialRepository
    {
        private readonly HolaExpressContext _context;

        public FinancialRepository(HolaExpressContext context)
        {
            _context = context;
        }

        public async Task<List<FeeConfigDto>> GetFeeConfigsAsync()
        {
            var feeConfigs = await _context.FeeConfigs
                .OrderBy(f => f.FeeConfigId)
                .ToListAsync();

            return feeConfigs.Select(f => new FeeConfigDto
            {
                Name = f.Name,
                Type = f.Type,
                Value = f.Value,
                Unit = f.Unit,
                Description = f.Description,
                IsActive = f.IsActive
            }).ToList();
        }

        public async Task<bool> UpdateFeeConfigAsync(string feeType, decimal value, bool isActive)
        {
            var feeConfig = await _context.FeeConfigs
                .FirstOrDefaultAsync(f => f.Name == feeType);

            if (feeConfig == null)
            {
                return false;
            }

            feeConfig.Value = value;
            feeConfig.IsActive = isActive;
            feeConfig.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<RevenueStatsDto> GetRevenueStatsAsync(DateTime startDate, DateTime endDate)
        {
            var completedOrders = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED")
                    && o.CreatedAt >= startDate
                    && o.CreatedAt <= endDate)
                .ToListAsync();

            var totalRevenue = completedOrders.Sum(o => o.TotalAmount);
            var platformFeeRate = 0.15m; // 15%
            var platformFee = totalRevenue * platformFeeRate;

            // Tính order revenue (không bao gồm delivery fee)
            var orderRevenue = completedOrders.Sum(o => o.TotalAmount - (o.ShippingFee ?? 0));
            var deliveryRevenue = completedOrders.Sum(o => o.ShippingFee ?? 0);

            // Tính growth rate so với kỳ trước
            var periodDays = (endDate - startDate).Days;
            var previousStartDate = startDate.AddDays(-periodDays);
            var previousEndDate = startDate;

            var previousRevenue = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED")
                    && o.CreatedAt >= previousStartDate
                    && o.CreatedAt < previousEndDate)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var growthRate = previousRevenue > 0
                ? ((totalRevenue - previousRevenue) / previousRevenue * 100)
                : 0;

            // Daily revenues
            var dailyRevenues = completedOrders
                .GroupBy(o => o.CreatedAt!.Value.Date)
                .Select(g => new DailyRevenueDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Amount = g.Sum(o => o.TotalAmount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            // Top stores
            var topStores = await _context.Orders
                .Where(o => (o.Status == "COMPLETED" || o.Status == "DELIVERED")
                    && o.CreatedAt >= startDate
                    && o.CreatedAt <= endDate
                    && o.StoreId != null)
                .Include(o => o.Store)
                .GroupBy(o => new { o.StoreId, o.Store!.StoreName })
                .Select(g => new TopStoreDto
                {
                    StoreId = g.Key.StoreId!.Value,
                    StoreName = g.Key.StoreName ?? "",
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count()
                })
                .OrderByDescending(s => s.Revenue)
                .Take(5)
                .ToListAsync();

            return new RevenueStatsDto
            {
                TotalRevenue = totalRevenue,
                OrderRevenue = orderRevenue,
                DeliveryRevenue = deliveryRevenue,
                PlatformFee = platformFee,
                GrowthRate = growthRate,
                DailyRevenues = dailyRevenues,
                TopStores = topStores
            };
        }

        public async Task<List<ReconciliationItemDto>> GetStoreReconciliationsAsync(string? status)
        {
            var query = _context.Reconciliations
                .Where(r => r.Type == "store");

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var reconciliations = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = new List<ReconciliationItemDto>();

            foreach (var r in reconciliations)
            {
                var store = await _context.Stores.FindAsync(r.EntityId);
                
                result.Add(new ReconciliationItemDto
                {
                    Id = r.ReconciliationId,
                    Name = store?.StoreName ?? "",
                    Type = "store",
                    TotalOrders = r.TotalOrders,
                    TotalRevenue = r.TotalRevenue,
                    PlatformFee = r.PlatformFee,
                    DeliveryFee = r.DeliveryFee,
                    AmountToPay = r.AmountToPay,
                    Status = r.Status,
                    Period = $"{r.StartDate:dd/MM/yyyy} - {r.EndDate:dd/MM/yyyy}",
                    ApprovedAt = r.ApprovedAt,
                    CompletedAt = r.CompletedAt
                });
            }

            return result;
        }

        public async Task<List<ReconciliationItemDto>> GetShipperReconciliationsAsync(string? status)
        {
            var query = _context.Reconciliations
                .Where(r => r.Type == "shipper");

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var reconciliations = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = new List<ReconciliationItemDto>();

            foreach (var r in reconciliations)
            {
                var shipper = await _context.Users.FindAsync(r.EntityId);
                
                result.Add(new ReconciliationItemDto
                {
                    Id = r.ReconciliationId,
                    Name = shipper?.FullName ?? "",
                    Type = "shipper",
                    TotalOrders = r.TotalOrders,
                    TotalRevenue = r.TotalRevenue,
                    PlatformFee = r.PlatformFee,
                    DeliveryFee = r.DeliveryFee,
                    AmountToPay = r.AmountToPay,
                    Status = r.Status,
                    Period = $"{r.StartDate:dd/MM/yyyy} - {r.EndDate:dd/MM/yyyy}",
                    ApprovedAt = r.ApprovedAt,
                    CompletedAt = r.CompletedAt
                });
            }

            return result;
        }

        public async Task<bool> UpdateStoreReconciliationStatusAsync(int id, string status, string? adminNote)
        {
            var reconciliation = await _context.Reconciliations
                .FirstOrDefaultAsync(r => r.ReconciliationId == id && r.Type == "store");

            if (reconciliation == null)
            {
                return false;
            }

            reconciliation.Status = status;
            reconciliation.AdminNote = adminNote;

            if (status == "processing" && !reconciliation.ApprovedAt.HasValue)
            {
                reconciliation.ApprovedAt = DateTime.UtcNow;
            }
            else if (status == "completed")
            {
                reconciliation.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateShipperReconciliationStatusAsync(int id, string status, string? adminNote)
        {
            var reconciliation = await _context.Reconciliations
                .FirstOrDefaultAsync(r => r.ReconciliationId == id && r.Type == "shipper");

            if (reconciliation == null)
            {
                return false;
            }

            reconciliation.Status = status;
            reconciliation.AdminNote = adminNote;

            if (status == "processing" && !reconciliation.ApprovedAt.HasValue)
            {
                reconciliation.ApprovedAt = DateTime.UtcNow;
            }
            else if (status == "completed")
            {
                reconciliation.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(string? status)
        {
            var query = _context.RefundRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.Store)
                .Include(r => r.Customer)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var refunds = await query
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            return refunds.Select(r => new RefundRequestDto
            {
                Id = r.RefundRequestId,
                OrderCode = r.Order.OrderCode ?? "",
                CustomerName = r.Customer.FullName ?? "",
                StoreName = r.Order.Store?.StoreName ?? "",
                OrderAmount = r.Order.TotalAmount,
                RefundAmount = r.RefundAmount,
                Reason = r.Reason,
                RequestDate = r.RequestDate,
                Status = r.Status,
                AdminNote = r.AdminNote,
                ProcessedAt = r.ProcessedAt
            }).ToList();
        }

        public async Task<bool> UpdateRefundStatusAsync(int refundId, string status, string adminNote)
        {
            var refundRequest = await _context.RefundRequests
                .FirstOrDefaultAsync(r => r.RefundRequestId == refundId);

            if (refundRequest == null)
            {
                return false;
            }

            refundRequest.Status = status;
            refundRequest.AdminNote = adminNote;
            refundRequest.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
