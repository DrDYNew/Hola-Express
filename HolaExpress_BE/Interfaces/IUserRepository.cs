using HolaExpress_BE.Models;

namespace HolaExpress_BE.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailOrPhoneAsync(string emailOrPhone);
    Task<User?> GetByIdAsync(int userId);
    Task<User> CreateAsync(User user);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> PhoneExistsAsync(string phoneNumber);
    Task SaveChangesAsync();
}
