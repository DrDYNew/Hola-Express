using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class FinancialController : ControllerBase
    {
        private readonly IFinancialService _financialService;
        private readonly ILogger<FinancialController> _logger;

        public FinancialController(IFinancialService financialService, ILogger<FinancialController> logger)
        {
            _financialService = financialService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách cấu hình phí
        /// GET: api/admin/financial/fees
        /// </summary>
        [HttpGet("fees")]
        public async Task<IActionResult> GetFeeConfigs()
        {
            try
            {
                var fees = await _financialService.GetFeeConfigsAsync();

                return Ok(new
                {
                    success = true,
                    data = fees
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fee configs");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải cấu hình phí"
                });
            }
        }

        /// <summary>
        /// Cập nhật cấu hình phí
        /// PUT: api/admin/financial/fees/{feeType}
        /// </summary>
        [HttpPut("fees/{feeType}")]
        public async Task<IActionResult> UpdateFeeConfig(string feeType, [FromBody] UpdateFeeConfigDto dto)
        {
            try
            {
                var result = await _financialService.UpdateFeeConfigAsync(feeType, dto);

                if (result)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật cấu hình phí thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể cập nhật cấu hình phí"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fee config {FeeType}", feeType);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi cập nhật cấu hình phí"
                });
            }
        }

        /// <summary>
        /// Lấy thống kê doanh thu
        /// GET: api/admin/financial/revenue-stats?period=month
        /// </summary>
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetRevenueStats([FromQuery] string period = "month")
        {
            try
            {
                var query = new RevenueQueryDto { Period = period };
                var stats = await _financialService.GetRevenueStatsAsync(query);

                return Ok(new
                {
                    success = true,
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue stats");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thống kê doanh thu"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách đối soát
        /// GET: api/admin/financial/reconciliations?type=store&status=pending
        /// </summary>
        [HttpGet("reconciliations")]
        public async Task<IActionResult> GetReconciliations(
            [FromQuery] string type, 
            [FromQuery] string? status = null)
        {
            try
            {
                if (type != "store" && type != "shipper")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Type phải là 'store' hoặc 'shipper'"
                    });
                }

                var reconciliations = await _financialService.GetReconciliationsAsync(type, status);

                return Ok(new
                {
                    success = true,
                    data = reconciliations
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reconciliations");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải dữ liệu đối soát"
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đối soát
        /// PUT: api/admin/financial/reconciliations/{type}/{id}
        /// </summary>
        [HttpPut("reconciliations/{type}/{id}")]
        public async Task<IActionResult> UpdateReconciliationStatus(
            string type, 
            int id, 
            [FromBody] UpdateReconciliationStatusDto dto)
        {
            try
            {
                if (type != "store" && type != "shipper")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Type phải là 'store' hoặc 'shipper'"
                    });
                }

                var result = await _financialService.UpdateReconciliationStatusAsync(id, type, dto);

                if (result)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật trạng thái thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reconciliation status");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi cập nhật trạng thái"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách yêu cầu hoàn tiền
        /// GET: api/admin/financial/refunds?status=pending
        /// </summary>
        [HttpGet("refunds")]
        public async Task<IActionResult> GetRefundRequests([FromQuery] string? status = null)
        {
            try
            {
                var refunds = await _financialService.GetRefundRequestsAsync(status);

                return Ok(new
                {
                    success = true,
                    data = refunds
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting refund requests");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách hoàn tiền"
                });
            }
        }

        /// <summary>
        /// Xử lý yêu cầu hoàn tiền
        /// PUT: api/admin/financial/refunds/{id}/process
        /// </summary>
        [HttpPut("refunds/{id}/process")]
        public async Task<IActionResult> ProcessRefund(int id, [FromBody] ProcessRefundDto dto)
        {
            try
            {
                if (dto.Status != "approved" && dto.Status != "rejected" && dto.Status != "completed")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Status phải là 'approved', 'rejected' hoặc 'completed'"
                    });
                }

                var result = await _financialService.ProcessRefundAsync(id, dto);

                if (result)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Xử lý yêu cầu hoàn tiền thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể xử lý yêu cầu hoàn tiền"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund {RefundId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi xử lý yêu cầu hoàn tiền"
                });
            }
        }
    }
}
