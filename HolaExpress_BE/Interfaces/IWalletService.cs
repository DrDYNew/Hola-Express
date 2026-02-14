using HolaExpress_BE.DTOs.Wallet;

namespace HolaExpress_BE.Interfaces;

public interface IWalletService
{
    Task<WalletDto> GetWalletAsync(int userId);
    Task<TransactionHistoryDto> GetTransactionHistoryAsync(int userId, int page = 1, int pageSize = 20);
    Task<TopUpPaymentDataDto> CreateTopUpPaymentAsync(int userId, TopUpRequestDto request);
    Task<bool> VerifyTopUpPaymentAsync(string orderCode);
    Task<WalletDto> WithdrawAsync(int userId, WithdrawRequestDto request);
    Task<bool> DeductBalanceAsync(int userId, decimal amount, string description, int? referenceOrderId = null);
}
