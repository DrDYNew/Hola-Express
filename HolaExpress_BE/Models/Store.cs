using System;
using System.Collections.Generic;

namespace HolaExpress_BE.Models;

public partial class Store
{
    public int StoreId { get; set; }

    public int? OwnerId { get; set; }

    public string StoreName { get; set; } = null!;

    public string? Address { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string? Hotline { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsOpenNow { get; set; }

    public decimal? Rating { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();

    public virtual ICollection<Ingredient> Ingredients { get; set; } = new List<Ingredient>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual User? Owner { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<StoreOperatingHour> StoreOperatingHours { get; set; } = new List<StoreOperatingHour>();

    public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();

    public virtual ICollection<Topping> Toppings { get; set; } = new List<Topping>();

    public virtual ICollection<Voucher> Vouchers { get; set; } = new List<Voucher>();
}
