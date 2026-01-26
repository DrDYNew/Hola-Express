using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace HolaExpress_BE.Models;

public partial class HolaExpressContext : DbContext
{
    public HolaExpressContext()
    {
    }

    public HolaExpressContext(DbContextOptions<HolaExpressContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Banner> Banners { get; set; }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Ingredient> Ingredients { get; set; }

    public virtual DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderDetail> OrderDetails { get; set; }

    public virtual DbSet<OrderDetailTopping> OrderDetailToppings { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<Recipe> Recipes { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ShipperProfile> ShipperProfiles { get; set; }

    public virtual DbSet<Store> Stores { get; set; }

    public virtual DbSet<StoreOperatingHour> StoreOperatingHours { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<Topping> Toppings { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserAddress> UserAddresses { get; set; }

    public virtual DbSet<Voucher> Vouchers { get; set; }

    public virtual DbSet<Wallet> Wallets { get; set; }

    public virtual DbSet<WalletTransaction> WalletTransactions { get; set; }

   protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    if (!optionsBuilder.IsConfigured)
    {
        var ConnectionString = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetConnectionString("DefaultConnection");
        optionsBuilder.UseSqlServer(ConnectionString);
    }
    
}
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.CartId).HasName("PK__Carts__2EF52A276AB85D2B");

            entity.HasIndex(e => e.UserId, "UQ__Carts__B9BE370E9489A8B8").IsUnique();

            entity.Property(e => e.CartId).HasColumnName("cart_id");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Store).WithMany(p => p.Carts)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Carts__store_id__04AFB25B");

            entity.HasOne(d => d.User).WithOne(p => p.Cart)
                .HasForeignKey<Cart>(d => d.UserId)
                .HasConstraintName("FK__Carts__user_id__03BB8E22");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__CartItem__52020FDD79344CAD");

            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.CartId).HasColumnName("cart_id");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity)
                .HasDefaultValue(1)
                .HasColumnName("quantity");
            entity.Property(e => e.VariantId).HasColumnName("variant_id");

            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__CartItems__cart___0880433F");

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__CartItems__produ__09746778");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__D54EE9B4C4DB2C9E");

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(100)
                .HasColumnName("category_name");
            entity.Property(e => e.Priority)
                .HasDefaultValue(0)
                .HasColumnName("priority");
            entity.Property(e => e.StoreId).HasColumnName("store_id");

            entity.HasOne(d => d.Store).WithMany(p => p.Categories)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Categorie__store__540C7B00");
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.HasKey(e => e.IngredientId).HasName("PK__Ingredie__B0E453CFD1B108CB");

            entity.Property(e => e.IngredientId).HasColumnName("ingredient_id");
            entity.Property(e => e.CurrentStock)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 4)")
                .HasColumnName("current_stock");
            entity.Property(e => e.IngredientName)
                .HasMaxLength(100)
                .HasColumnName("ingredient_name");
            entity.Property(e => e.LastUpdated)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("last_updated");
            entity.Property(e => e.MinStockAlert)
                .HasDefaultValue(10m)
                .HasColumnType("decimal(18, 4)")
                .HasColumnName("min_stock_alert");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.Unit)
                .HasMaxLength(20)
                .HasColumnName("unit");

            entity.HasOne(d => d.Store).WithMany(p => p.Ingredients)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Ingredien__store__69FBBC1F");
        });

        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.HasKey(e => e.TransId).HasName("PK__Inventor__438CAC18AF54C14B");

            entity.Property(e => e.TransId).HasColumnName("trans_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IngredientId).HasColumnName("ingredient_id");
            entity.Property(e => e.QuantityChange)
                .HasColumnType("decimal(18, 4)")
                .HasColumnName("quantity_change");
            entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("type");
            entity.Property(e => e.UnitCost)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("unit_cost");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.InventoryTransactions)
                .HasForeignKey(d => d.IngredientId)
                .HasConstraintName("FK__Inventory__ingre__74794A92");

            entity.HasOne(d => d.Supplier).WithMany(p => p.InventoryTransactions)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("FK__Inventory__suppl__756D6ECB");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotiId).HasName("PK__Notifica__FDA4F30AD9223078");

            entity.Property(e => e.NotiId).HasColumnName("noti_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("is_read");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Title)
                .HasMaxLength(100)
                .HasColumnName("title");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Notificat__user___40F9A68C");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__46596229BC7F6CA0");

            entity.HasIndex(e => e.OrderCode, "UQ__Orders__99D12D3FF6A0A932").IsUnique();

            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.CancelReason)
                .HasMaxLength(255)
                .HasColumnName("cancel_reason");
            entity.Property(e => e.CompletedAt)
                .HasColumnType("datetime")
                .HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.CustomerNote)
                .HasMaxLength(255)
                .HasColumnName("customer_note");
            entity.Property(e => e.DeliveryAddress).HasColumnName("delivery_address");
            entity.Property(e => e.DiscountAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("discount_amount");
            entity.Property(e => e.OrderCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("order_code");
            entity.Property(e => e.OrderSource)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("APP")
                .HasColumnName("order_source");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("payment_method");
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("UNPAID")
                .HasColumnName("payment_status");
            entity.Property(e => e.PlatformFee)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("platform_fee");
            entity.Property(e => e.ShipperId).HasColumnName("shipper_id");
            entity.Property(e => e.ShippingFee)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("shipping_fee");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("subtotal");
            entity.Property(e => e.TotalAmount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_amount");
            entity.Property(e => e.VoucherId).HasColumnName("voucher_id");

            entity.HasOne(d => d.Customer).WithMany(p => p.OrderCustomers)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("FK__Orders__customer__0E391C95");

            entity.HasOne(d => d.Shipper).WithMany(p => p.OrderShippers)
                .HasForeignKey(d => d.ShipperId)
                .HasConstraintName("FK__Orders__shipper___10216507");

            entity.HasOne(d => d.Store).WithMany(p => p.Orders)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Orders__store_id__0F2D40CE");

            entity.HasOne(d => d.Voucher).WithMany(p => p.Orders)
                .HasForeignKey(d => d.VoucherId)
                .HasConstraintName("FK__Orders__voucher___11158940");
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.HasKey(e => e.DetailId).HasName("PK__OrderDet__38E9A224DAADF9ED");

            entity.Property(e => e.DetailId).HasColumnName("detail_id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.PriceSnapshot)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price_snapshot");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductNameSnapshot)
                .HasMaxLength(100)
                .HasColumnName("product_name_snapshot");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.TotalPrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_price");
            entity.Property(e => e.VariantNameSnapshot)
                .HasMaxLength(50)
                .HasColumnName("variant_name_snapshot");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__OrderDeta__order__1B9317B3");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__OrderDeta__produ__1C873BEC");
        });

        modelBuilder.Entity<OrderDetailTopping>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderDet__3213E83F0E2C94EE");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DetailId).HasColumnName("detail_id");
            entity.Property(e => e.PriceSnapshot)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price_snapshot");
            entity.Property(e => e.ToppingNameSnapshot)
                .HasMaxLength(100)
                .HasColumnName("topping_name_snapshot");

            entity.HasOne(d => d.Detail).WithMany(p => p.OrderDetailToppings)
                .HasForeignKey(d => d.DetailId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__OrderDeta__detai__1F63A897");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__47027DF567226688");

            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.BasePrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("base_price");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsSoldOut)
                .HasDefaultValue(false)
                .HasColumnName("is_sold_out");
            entity.Property(e => e.ProductName)
                .HasMaxLength(100)
                .HasColumnName("product_name");
            entity.Property(e => e.StoreId).HasColumnName("store_id");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK__Products__catego__58D1301D");

            entity.HasOne(d => d.Store).WithMany(p => p.Products)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Products__store___57DD0BE4");

            entity.HasMany(d => d.Toppings).WithMany(p => p.Products)
                .UsingEntity<Dictionary<string, object>>(
                    "ProductTopping",
                    r => r.HasOne<Topping>().WithMany()
                        .HasForeignKey("ToppingId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__ProductTo__toppi__671F4F74"),
                    l => l.HasOne<Product>().WithMany()
                        .HasForeignKey("ProductId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__ProductTo__produ__662B2B3B"),
                    j =>
                    {
                        j.HasKey("ProductId", "ToppingId").HasName("PK__ProductT__36439C15A12E80C9");
                        j.ToTable("ProductToppings");
                        j.IndexerProperty<int>("ProductId").HasColumnName("product_id");
                        j.IndexerProperty<int>("ToppingId").HasColumnName("topping_id");
                    });
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.VariantId).HasName("PK__ProductV__EACC68B725E45427");

            entity.Property(e => e.VariantId).HasColumnName("variant_id");
            entity.Property(e => e.PriceAdjustment)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price_adjustment");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.VariantName)
                .HasMaxLength(50)
                .HasColumnName("variant_name");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__ProductVa__produ__5D95E53A");
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.HasKey(e => e.RecipeId).HasName("PK__Recipes__3571ED9B2B86039D");

            entity.Property(e => e.RecipeId).HasColumnName("recipe_id");
            entity.Property(e => e.IngredientId).HasColumnName("ingredient_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.QuantityNeeded)
                .HasColumnType("decimal(18, 4)")
                .HasColumnName("quantity_needed");
            entity.Property(e => e.VariantId).HasColumnName("variant_id");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.Recipes)
                .HasForeignKey(d => d.IngredientId)
                .HasConstraintName("FK__Recipes__ingredi__719CDDE7");

            entity.HasOne(d => d.Product).WithMany(p => p.Recipes)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__Recipes__product__6FB49575");

            entity.HasOne(d => d.Variant).WithMany(p => p.Recipes)
                .HasForeignKey(d => d.VariantId)
                .HasConstraintName("FK__Recipes__variant__70A8B9AE");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PK__Reviews__60883D9090E652E2");

            entity.HasIndex(e => e.OrderId, "UQ__Reviews__465962281235454C").IsUnique();

            entity.Property(e => e.ReviewId).HasColumnName("review_id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ResponseFromStore).HasColumnName("response_from_store");
            entity.Property(e => e.ShipperRating).HasColumnName("shipper_rating");
            entity.Property(e => e.StoreRating).HasColumnName("store_rating");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Order).WithOne(p => p.Review)
                .HasForeignKey<Review>(d => d.OrderId)
                .HasConstraintName("FK__Reviews__order_i__2704CA5F");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Reviews__user_id__27F8EE98");
        });

        modelBuilder.Entity<ShipperProfile>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PK__ShipperP__AEBB701FEFFE8CA0");

            entity.Property(e => e.ProfileId).HasColumnName("profile_id");
            entity.Property(e => e.CurrentLat).HasColumnName("current_lat");
            entity.Property(e => e.CurrentLong).HasColumnName("current_long");
            entity.Property(e => e.IsOnline)
                .HasDefaultValue(false)
                .HasColumnName("is_online");
            entity.Property(e => e.LastLocationUpdate)
                .HasColumnType("datetime")
                .HasColumnName("last_location_update");
            entity.Property(e => e.LicenseNumber)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("license_number");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VehiclePlate)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("vehicle_plate");

            entity.HasOne(d => d.User).WithMany(p => p.ShipperProfiles)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__ShipperPr__user___22401542");
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.HasKey(e => e.StoreId).HasName("PK__Stores__A2F2A30C65179499");

            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Hotline)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("hotline");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsOpenNow)
                .HasDefaultValue(true)
                .HasColumnName("is_open_now");
            entity.Property(e => e.Latitude).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasColumnName("longitude");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.Rating)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(2, 1)")
                .HasColumnName("rating");
            entity.Property(e => e.StoreName)
                .HasMaxLength(100)
                .HasColumnName("store_name");

            entity.HasOne(d => d.Owner).WithMany(p => p.Stores)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("FK__Stores__owner_id__45BE5BA9");
        });

        modelBuilder.Entity<StoreOperatingHour>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StoreOpe__3213E83F5A529E7F");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CloseTime).HasColumnName("close_time");
            entity.Property(e => e.DayOfWeek).HasColumnName("day_of_week");
            entity.Property(e => e.IsClosedToday)
                .HasDefaultValue(false)
                .HasColumnName("is_closed_today");
            entity.Property(e => e.OpenTime).HasColumnName("open_time");
            entity.Property(e => e.StoreId).HasColumnName("store_id");

            entity.HasOne(d => d.Store).WithMany(p => p.StoreOperatingHours)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__StoreOper__store__4C6B5938");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.SupplierId).HasName("PK__Supplier__6EE594E8DA820254");

            entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.ContactPhone)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("contact_phone");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.SupplierName)
                .HasMaxLength(100)
                .HasColumnName("supplier_name");

            entity.HasOne(d => d.Store).WithMany(p => p.Suppliers)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Suppliers__store__51300E55");
        });

        modelBuilder.Entity<Topping>(entity =>
        {
            entity.HasKey(e => e.ToppingId).HasName("PK__Toppings__141E1E064B9D5395");

            entity.Property(e => e.ToppingId).HasColumnName("topping_id");
            entity.Property(e => e.IsAvailable)
                .HasDefaultValue(true)
                .HasColumnName("is_available");
            entity.Property(e => e.Price)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.ToppingName)
                .HasMaxLength(100)
                .HasColumnName("topping_name");

            entity.HasOne(d => d.Store).WithMany(p => p.Toppings)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Toppings__store___6166761E");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__B9BE370F08B3836E");

            entity.HasIndex(e => e.PhoneNumber, "UQ__Users__A1936A6BA8DCF7A9").IsUnique();

            entity.HasIndex(e => e.Email, "UQ__Users__AB6E616433CD7A1B").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(100)
                .HasColumnName("full_name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("password_hash");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("phone_number");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("role");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
        });

        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__UserAddr__CAA247C8C77AEC0A");

            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.AddressText)
                .HasMaxLength(255)
                .HasColumnName("address_text");
            entity.Property(e => e.IsDefault)
                .HasDefaultValue(false)
                .HasColumnName("is_default");
            entity.Property(e => e.Label)
                .HasMaxLength(50)
                .HasColumnName("label");
            entity.Property(e => e.Latitude).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasColumnName("longitude");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.UserAddresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserAddre__user___31B762FC");
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__Vouchers__80B6FFA825369CE0");

            entity.HasIndex(e => e.Code, "UQ__Vouchers__357D4CF9502DD83A").IsUnique();

            entity.Property(e => e.VoucherId).HasColumnName("voucher_id");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("code");
            entity.Property(e => e.DiscountType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("discount_type");
            entity.Property(e => e.DiscountValue)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("discount_value");
            entity.Property(e => e.EndDate)
                .HasColumnType("datetime")
                .HasColumnName("end_date");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MaxDiscountAmount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("max_discount_amount");
            entity.Property(e => e.MinOrderValue)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("min_order_value");
            entity.Property(e => e.StartDate)
                .HasColumnType("datetime")
                .HasColumnName("start_date");
            entity.Property(e => e.StoreId).HasColumnName("store_id");
            entity.Property(e => e.UsageLimit)
                .HasDefaultValue(100)
                .HasColumnName("usage_limit");

            entity.HasOne(d => d.Store).WithMany(p => p.Vouchers)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK__Vouchers__store___7C1A6C5A");
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.WalletId).HasName("PK__Wallets__0EE6F041F31F9A39");

            entity.HasIndex(e => e.UserId, "UQ__Wallets__B9BE370E309B52CD").IsUnique();

            entity.Property(e => e.WalletId).HasColumnName("wallet_id");
            entity.Property(e => e.Balance)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("balance");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("VND")
                .HasColumnName("currency");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Wallet)
                .HasForeignKey<Wallet>(d => d.UserId)
                .HasConstraintName("FK__Wallets__user_id__367C1819");
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.TransactionId).HasName("PK__WalletTr__85C600AF9932098E");

            entity.Property(e => e.TransactionId).HasColumnName("transaction_id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("amount");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.ReferenceOrderId).HasColumnName("reference_order_id");
            entity.Property(e => e.TransactionType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("transaction_type");
            entity.Property(e => e.WalletId).HasColumnName("wallet_id");

            entity.HasOne(d => d.Wallet).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.WalletId)
                .HasConstraintName("FK__WalletTra__walle__3C34F16F");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
