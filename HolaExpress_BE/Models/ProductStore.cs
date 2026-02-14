namespace HolaExpress_BE.Models
{
    public class ProductStore
    {
        public int ProductStoreId { get; set; }
        public int ProductId { get; set; }
        public int StoreId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Product? Product { get; set; }
        public virtual Store? Store { get; set; }
    }
}
