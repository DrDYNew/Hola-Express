namespace HolaExpress_BE.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string fullName, string verificationToken);
    Task SendWelcomeEmailAsync(string toEmail, string fullName);
    Task SendOrderConfirmationEmailAsync(string toEmail, string fullName, string orderCode);
}
