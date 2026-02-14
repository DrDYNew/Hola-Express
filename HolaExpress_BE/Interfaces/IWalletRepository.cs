using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetWalletByUserIdAsync(int userId);
    Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(int walletId, int page, int pageSize);
    Task<WalletTransaction?> AddTransactionAsync(WalletTransaction transaction);
    Task<bool> UpdateWalletBalanceAsync(int walletId, decimal newBalance);
}
