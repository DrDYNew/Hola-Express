using System.Net;
using System.Net.Mail;

namespace HolaExpress_BE.Services;

public class EmailService : Interfaces.IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string fullName, string verificationToken)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var fromEmail = emailSettings["FromEmail"] ?? throw new InvalidOperationException("Email FromEmail not configured");
        var fromPassword = emailSettings["FromPassword"] ?? throw new InvalidOperationException("Email FromPassword not configured");
        var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");

        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "http://localhost:5000";
        var verificationLink = $"{baseUrl}/api/Auth/verify-email?token={verificationToken}";

        var subject = "Xác thực tài khoản Hola Express";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 15px 30px; background: #FF6B6B; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🍕 Chào mừng đến với Hola Express</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Hola Express</strong> - Giao đồ ăn siêu tốc!</p>
            <p>Để hoàn tất đăng ký và kích hoạt tài khoản, vui lòng nhấn vào nút bên dưới:</p>
            <div style='text-align: center;'>
                <a href='{verificationLink}' class='button'>✓ Xác thực tài khoản</a>
            </div>
            <p style='margin-top: 20px; padding: 15px; background: #fff; border-left: 4px solid #FF6B6B;'>
                <strong>Lưu ý:</strong> Link xác thực này sẽ hết hạn sau 24 giờ.
            </p>
            <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br><strong>Đội ngũ Hola Express</strong></p>
        </div>
        <div class='footer'>
            <p>© 2026 Hola Express. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không reply.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body, fromEmail, fromPassword, smtpHost, smtpPort);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var fromEmail = emailSettings["FromEmail"] ?? throw new InvalidOperationException("Email FromEmail not configured");
        var fromPassword = emailSettings["FromPassword"] ?? throw new InvalidOperationException("Email FromPassword not configured");
        var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");

        var subject = "Chào mừng đến với Hola Express! 🎉";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .feature {{ background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #FF6B6B; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Tài khoản đã được kích hoạt!</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            <p>Tài khoản của bạn đã được xác thực thành công! Bây giờ bạn có thể bắt đầu đặt món ngon cùng <strong>Hola Express</strong>.</p>
            
            <h3 style='color: #FF6B6B;'>🌟 Những gì bạn có thể làm:</h3>
            
            <div class='feature'>
                <strong>🍔 Đặt đồ ăn</strong>
                <p>Hàng ngàn món ăn từ các cửa hàng yêu thích</p>
            </div>
            
            <div class='feature'>
                <strong>🚀 Giao hàng nhanh</strong>
                <p>Shipper giao đến tận nơi trong thời gian ngắn nhất</p>
            </div>
            
            <div class='feature'>
                <strong>💰 Ưu đãi hấp dẫn</strong>
                <p>Nhiều voucher và chương trình khuyến mãi</p>
            </div>
            
            <div class='feature'>
                <strong>💳 Thanh toán linh hoạt</strong>
                <p>Tiền mặt, ví điện tử, chuyển khoản</p>
            </div>
            
            <div class='feature'>
                <strong>⭐ Theo dõi đơn hàng</strong>
                <p>Cập nhật trạng thái đơn hàng real-time</p>
            </div>
            
            <p style='margin-top: 20px;'>Hãy bắt đầu ngay hôm nay và trải nghiệm dịch vụ tuyệt vời!</p>
            <p>Chúc bạn ăn ngon miệng! 🍕</p>
            <p>Trân trọng,<br><strong>Đội ngũ Hola Express</strong></p>
        </div>
        <div class='footer'>
            <p>© 2026 Hola Express. All rights reserved.</p>
            <p>Hotline: 1900-xxxx | Email: support@holaexpress.vn</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body, fromEmail, fromPassword, smtpHost, smtpPort);
    }

    public async Task SendOrderConfirmationEmailAsync(string toEmail, string fullName, string orderCode)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var fromEmail = emailSettings["FromEmail"] ?? throw new InvalidOperationException("Email FromEmail not configured");
        var fromPassword = emailSettings["FromPassword"] ?? throw new InvalidOperationException("Email FromPassword not configured");
        var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");

        var subject = $"Xác nhận đơn hàng #{orderCode} - Hola Express";
        var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .order-code {{ font-size: 24px; font-weight: bold; color: #FF6B6B; text-align: center; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Đơn hàng đã được xác nhận</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại Hola Express!</p>
            <div class='order-code'>#{orderCode}</div>
            <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi shipper bắt đầu giao hàng.</p>
            <p>Bạn có thể theo dõi trạng thái đơn hàng trong ứng dụng.</p>
            <p>Trân trọng,<br><strong>Đội ngũ Hola Express</strong></p>
        </div>
        <div class='footer'>
            <p>© 2026 Hola Express. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, body, fromEmail, fromPassword, smtpHost, smtpPort);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body, string fromEmail, string fromPassword, string smtpHost, int smtpPort)
    {
        try
        {
            using var smtpClient = new SmtpClient(smtpHost)
            {
                Port = smtpPort,
                Credentials = new NetworkCredential(fromEmail, fromPassword),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, "Hola Express"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }
}
