using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.DTOs.Admin;
using HolaExpress_BE.Interfaces.Admin;

namespace HolaExpress_BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                _logger.LogError(ex, "Error fetching fee configs");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải cấu hình phí"
                });
            }
        }

        /// <summary>
        /// Cập nhật cấu hình phí
        /// </summary>
        [HttpPut("fees/{feeType}")]
        public async Task<IActionResult> UpdateFeeConfig(string feeType, [FromBody] UpdateFeeConfigDto dto)
        {
            try
            {
                var result = await _financialService.UpdateFeeConfigAsync(feeType, dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy cấu hình phí"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fee config: {FeeType}", feeType);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật cấu hình phí"
                });
            }
        }

        /// <summary>
        /// Lấy thống kê doanh thu
        /// </summary>
        [HttpGet("revenue/stats")]
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
                _logger.LogError(ex, "Error fetching revenue stats");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thống kê doanh thu"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách đối soát
        /// </summary>
        [HttpGet("reconciliations")]
        public async Task<IActionResult> GetReconciliations(
            [FromQuery] string type,
            [FromQuery] string? status = null)
        {
            try
            {
                if (string.IsNullOrEmpty(type) || (type != "store" && type != "shipper"))
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
                _logger.LogError(ex, "Error fetching reconciliations");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách đối soát"
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đối soát
        /// </summary>
        [HttpPut("reconciliations/{id}")]
        public async Task<IActionResult> UpdateReconciliationStatus(
            int id,
            [FromQuery] string type,
            [FromBody] UpdateReconciliationStatusDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(type) || (type != "store" && type != "shipper"))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Type phải là 'store' hoặc 'shipper'"
                    });
                }

                var result = await _financialService.UpdateReconciliationStatusAsync(id, type, dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy đối soát"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật trạng thái thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reconciliation status for id: {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái đối soát"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách yêu cầu hoàn tiền
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
                _logger.LogError(ex, "Error fetching refund requests");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách hoàn tiền"
                });
            }
        }

        /// <summary>
        /// Xử lý yêu cầu hoàn tiền
        /// </summary>
        [HttpPut("refunds/{refundId}")]
        public async Task<IActionResult> ProcessRefund(int refundId, [FromBody] ProcessRefundDto dto)
        {
            try
            {
                var result = await _financialService.ProcessRefundAsync(refundId, dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy yêu cầu hoàn tiền"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Xử lý hoàn tiền thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund: {RefundId}", refundId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể xử lý hoàn tiền"
                });
            }
        }
    }
}
