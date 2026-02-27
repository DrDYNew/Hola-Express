using System.ComponentModel.DataAnnotations;

namespace HolaExpress_BE.DTOs.Auth
{
    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }
}
