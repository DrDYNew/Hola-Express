import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export interface AddToCartRequest {
  productId: number;
  variantId?: number;
  quantity: number;
  note?: string;
  toppingIds?: number[];
}

export interface CartItem {
  itemId: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  basePrice: number;
  variantId?: number;
  variantName?: string;
  variantPriceAdjustment: number;
  quantity: number;
  note?: string;
  toppings?: CartTopping[];
  totalPrice: number;
}

export interface CartTopping {
  toppingId: number;
  toppingName: string;
  price: number;
}

export interface CartResponse {
  cartId: number;
  storeId: number;
  storeName: string;
  items: CartItem[];
  subTotal: number;
  totalItems: number;
}

class CartService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async addToCart(request: AddToCartRequest): Promise<CartResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Cart/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể thêm vào giỏ hàng');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async getCart(): Promise<CartResponse | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Cart`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy giỏ hàng');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  async removeFromCart(itemId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Cart/item/${itemId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa sản phẩm');
      }
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async updateQuantity(itemId: number, quantity: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Cart/item/${itemId}/quantity`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật số lượng');
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Cart/clear`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa giỏ hàng');
      }
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}

export default new CartService();
