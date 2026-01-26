using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class User
{
    public int UserId { get; set; }

    public string PhoneNumber { get; set; } = null!;

    public string? Email { get; set; }

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Role { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Cart? Cart { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Order> OrderCustomers { get; set; } = new List<Order>();

    public virtual ICollection<Order> OrderShippers { get; set; } = new List<Order>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<ShipperProfile> ShipperProfiles { get; set; } = new List<ShipperProfile>();

    public virtual ICollection<Store> Stores { get; set; } = new List<Store>();

    public virtual ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();

    public virtual Wallet? Wallet { get; set; }
}
