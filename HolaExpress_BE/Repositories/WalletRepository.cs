using HolaExpress_BE.Interfaces;
using HolaExpress_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly HolaExpressContext _context;

    public WalletRepository(HolaExpressContext context)
    {
        _context = context;
    }

    public async Task<Wallet?> GetWalletByUserIdAsync(int userId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId);

        // Create wallet if not exists
        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = userId,
                Balance = 0,
                Currency = "VND",
                UpdatedAt = DateTime.Now
            };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        return wallet;
    }

    public async Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(int walletId, int page, int pageSize)
    {
        return await _context.WalletTransactions
            .Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<WalletTransaction?> AddTransactionAsync(WalletTransaction transaction)
    {
        transaction.CreatedAt = DateTime.Now;
        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<bool> UpdateWalletBalanceAsync(int walletId, decimal newBalance)
    {
        var wallet = await _context.Wallets.FindAsync(walletId);
        if (wallet == null) return false;

        wallet.Balance = newBalance;
        wallet.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }
}
