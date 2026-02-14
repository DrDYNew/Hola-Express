using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Services.Admin
{
    public class FinancialService : IFinancialService
    {
        private readonly HolaExpressContext _context;
        private readonly ILogger<FinancialService> _logger;

        public FinancialService(HolaExpressContext context, ILogger<FinancialService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<FeeConfigDto>> GetFeeConfigsAsync()
        {
            try
            {
                // Mock data for now - replace with actual database table later
                return await Task.FromResult(new List<FeeConfigDto>
                {
                    new FeeConfigDto
                    {
                        Name = "platformCommission",
                        Type = "percentage",
                        Value = 15,
                        Unit = "%",
                        Description = "Phí hoa hồng nền tảng từ doanh thu cửa hàng",
                        IsActive = true
                    },
                    new FeeConfigDto
                    {
                        Name = "deliveryBaseFee",
                        Type = "fixed",
                        Value = 15000,
                        Unit = "đ",
                        Description = "Phí giao hàng cơ bản trong bán kính 3km",
                        IsActive = true
                    },
                    new FeeConfigDto
                    {
                        Name = "deliveryPerKm",
                        Type = "fixed",
                        Value = 5000,
                        Unit = "đ/km",
                        Description = "Phí giao hàng mỗi km vượt quá 3km",
                        IsActive = true
                    },
                    new FeeConfigDto
                    {
                        Name = "minOrderValue",
                        Type = "fixed",
                        Value = 30000,
                        Unit = "đ",
                        Description = "Giá trị đơn hàng tối thiểu",
                        IsActive = true
                    },
                    new FeeConfigDto
                    {
                        Name = "serviceFee",
                        Type = "percentage",
                        Value = 5,
                        Unit = "%",
                        Description = "Phí dịch vụ tính trên giá trị đơn hàng",
                        IsActive = true
                    },
                    new FeeConfigDto
                    {
                        Name = "paymentProcessingFee",
                        Type = "percentage",
                        Value = 2,
                        Unit = "%",
                        Description = "Phí xử lý thanh toán online",
                        IsActive = true
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fee configs");
                throw;
            }
        }

        public async Task<bool> UpdateFeeConfigAsync(string feeType, UpdateFeeConfigDto dto)
        {
            try
            {
                // Mock implementation - replace with actual database update
                _logger.LogInformation("Updating fee config {FeeType}: Value={Value}, IsActive={IsActive}", 
                    feeType, dto.Value, dto.IsActive);
                
                return await Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fee config {FeeType}", feeType);
                throw;
            }
        }

        public async Task<RevenueStatsDto> GetRevenueStatsAsync(RevenueQueryDto query)
        {
            try
            {
                var (startDate, endDate) = GetDateRange(query);

                var orders = await _context.Orders
                    .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate 
                        && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
                    .Include(o => o.Store)
                    .ToListAsync();

                var totalRevenue = orders.Sum(o => o.TotalAmount);
                var orderRevenue = orders.Sum(o => o.Subtotal);
                var deliveryRevenue = orders.Sum(o => o.ShippingFee ?? 0);
                var platformFee = orderRevenue * 0.15m; // 15% commission

                // Calculate growth rate (compare with previous period)
                var previousPeriodStart = startDate.AddDays(-(endDate - startDate).Days);
                var previousOrders = await _context.Orders
                    .Where(o => o.CreatedAt >= previousPeriodStart && o.CreatedAt < startDate
                        && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
                    .ToListAsync();
                
                var previousRevenue = previousOrders.Sum(o => o.TotalAmount);
                var growthRate = previousRevenue > 0 
                    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
                    : 0;

                // Daily revenues
                var dailyRevenues = orders
                    .GroupBy(o => o.CreatedAt!.Value.Date)
                    .Select(g => new DailyRevenueDto
                    {
                        Date = g.Key.ToString("dd/MM"),
                        Amount = g.Sum(o => o.TotalAmount)
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                // Top stores
                var topStores = orders
                    .Where(o => o.StoreId != null)
                    .GroupBy(o => new { o.StoreId, o.Store!.StoreName })
                    .Select(g => new TopStoreDto
                    {
                        StoreId = g.Key.StoreId!.Value,
                        StoreName = g.Key.StoreName,
                        Revenue = g.Sum(o => o.TotalAmount),
                        OrderCount = g.Count()
                    })
                    .OrderByDescending(s => s.Revenue)
                    .Take(5)
                    .ToList();

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue stats");
                throw;
            }
        }

        public async Task<List<ReconciliationItemDto>> GetReconciliationsAsync(string type, string? status = null)
        {
            try
            {
                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

                if (type.ToLower() == "store")
                {
                    var query = _context.Stores
                        .Where(s => s.IsActive == true)
                        .Select(s => new
                        {
                            s.StoreId,
                            s.StoreName,
                            Orders = s.Orders
                                .Where(o => o.CreatedAt >= startOfMonth && o.CreatedAt <= endOfMonth
                                    && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
                                .ToList()
                        });

                    var stores = await query.ToListAsync();

                    return stores.Select(s =>
                    {
                        var totalRevenue = s.Orders.Sum(o => o.Subtotal);
                        var platformFee = totalRevenue * 0.15m;

                        return new ReconciliationItemDto
                        {
                            Id = s.StoreId,
                            Name = s.StoreName,
                            Type = "store",
                            TotalOrders = s.Orders.Count,
                            TotalRevenue = totalRevenue,
                            PlatformFee = platformFee,
                            DeliveryFee = 0,
                            AmountToPay = totalRevenue - platformFee,
                            Status = totalRevenue > 0 ? "pending" : "completed",
                            Period = $"{startOfMonth:dd/MM} - {endOfMonth:dd/MM}"
                        };
                    })
                    .Where(r => status == null || r.Status == status)
                    .OrderByDescending(r => r.AmountToPay)
                    .ToList();
                }
                else // shipper
                {
                    var query = _context.ShipperProfiles
                        .Where(sp => sp.User!.Status == "ACTIVE")
                        .Include(sp => sp.User)
                            .ThenInclude(u => u.OrderShippers)
                        .Select(sp => new
                        {
                            ShipperId = sp.ProfileId,
                            sp.User!.FullName,
                            Orders = sp.User.OrderShippers
                                .Where(o => o.CreatedAt >= startOfMonth && o.CreatedAt <= endOfMonth
                                    && (o.Status == "COMPLETED" || o.Status == "DELIVERED"))
                                .ToList()
                        });

                    var shippers = await query.ToListAsync();

                    return shippers.Select(sp =>
                    {
                        var deliveryFee = sp.Orders.Sum(o => o.ShippingFee ?? 0);
                        var platformCut = deliveryFee * 0.20m; // Platform takes 20%

                        return new ReconciliationItemDto
                        {
                            Id = sp.ShipperId,
                            Name = sp.FullName ?? "Shipper",
                            Type = "shipper",
                            TotalOrders = sp.Orders.Count,
                            TotalRevenue = 0,
                            PlatformFee = 0,
                            DeliveryFee = deliveryFee,
                            AmountToPay = deliveryFee - platformCut,
                            Status = deliveryFee > 0 ? "pending" : "completed",
                            Period = $"{startOfMonth:dd/MM} - {endOfMonth:dd/MM}"
                        };
                    })
                    .Where(r => status == null || r.Status == status)
                    .OrderByDescending(r => r.AmountToPay)
                    .ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reconciliations for type {Type}", type);
                throw;
            }
        }

        public async Task<bool> UpdateReconciliationStatusAsync(int id, string type, UpdateReconciliationStatusDto dto)
        {
            try
            {
                _logger.LogInformation("Updating reconciliation {Type} {Id} to status {Status}", 
                    type, id, dto.Status);
                
                // Mock implementation - in real app, update database records
                return await Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reconciliation status");
                throw;
            }
        }

        public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(string? status = null)
        {
            try
            {
                // Mock data - replace with actual refund table
                var mockData = new List<RefundRequestDto>
                {
                    new RefundRequestDto
                    {
                        Id = 1,
                        OrderCode = "ORD001234",
                        CustomerName = "Nguyễn Văn A",
                        StoreName = "Phở Hà Nội",
                        OrderAmount = 150000,
                        RefundAmount = 150000,
                        Reason = "Món ăn không đúng mô tả, chất lượng kém",
                        RequestDate = DateTime.Now.AddHours(-2),
                        Status = "pending"
                    },
                    new RefundRequestDto
                    {
                        Id = 2,
                        OrderCode = "ORD001235",
                        CustomerName = "Trần Thị B",
                        StoreName = "Bún Chả Obama",
                        OrderAmount = 120000,
                        RefundAmount = 60000,
                        Reason = "Giao hàng quá chậm, món bị nguội",
                        RequestDate = DateTime.Now.AddHours(-5),
                        Status = "processing",
                        AdminNote = "Đang xác minh với cửa hàng"
                    },
                    new RefundRequestDto
                    {
                        Id = 3,
                        OrderCode = "ORD001236",
                        CustomerName = "Lê Văn C",
                        StoreName = "Bánh Mì Huỳnh Hoa",
                        OrderAmount = 80000,
                        RefundAmount = 80000,
                        Reason = "Shipper giao nhầm địa chỉ",
                        RequestDate = DateTime.Now.AddDays(-1),
                        Status = "approved",
                        AdminNote = "Đã xác nhận lỗi từ shipper",
                        ProcessedAt = DateTime.Now.AddHours(-1)
                    }
                };

                var result = status == null 
                    ? mockData 
                    : mockData.Where(r => r.Status == status).ToList();

                return await Task.FromResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting refund requests");
                throw;
            }
        }

        public async Task<bool> ProcessRefundAsync(int refundId, ProcessRefundDto dto)
        {
            try
            {
                _logger.LogInformation("Processing refund {RefundId}: Status={Status}, Note={Note}", 
                    refundId, dto.Status, dto.AdminNote);
                
                // Mock implementation - in real app:
                // 1. Update refund record status
                // 2. If approved, create wallet transaction for customer
                // 3. Send notification to customer
                
                return await Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund {RefundId}", refundId);
                throw;
            }
        }

        private (DateTime startDate, DateTime endDate) GetDateRange(RevenueQueryDto query)
        {
            var now = DateTime.Now;

            if (query.StartDate.HasValue && query.EndDate.HasValue)
            {
                return (query.StartDate.Value, query.EndDate.Value);
            }

            return query.Period.ToLower() switch
            {
                "today" => (now.Date, now.Date.AddDays(1).AddSeconds(-1)),
                "week" => (now.AddDays(-7), now),
                "month" => (new DateTime(now.Year, now.Month, 1), now),
                "year" => (new DateTime(now.Year, 1, 1), now),
                _ => (new DateTime(now.Year, now.Month, 1), now)
            };
        }
    }
}
