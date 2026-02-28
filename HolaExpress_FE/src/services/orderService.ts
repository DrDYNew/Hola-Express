import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://103.57.223.209:5110/api';

export interface CreateOrderRequest {
  storeId: number;
  userAddressId: number;
  customerNote?: string;
  paymentMethod: 'cash' | 'wallet' | 'banking';
  voucherId?: number;
  shippingFee: number;
}

export interface PaymentData {
  checkoutUrl: string;
  orderCode: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  expiresAt: number;
}

export interface CreateOrderResponse {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentData?: PaymentData;
}

export interface OrderHistoryItem {
  detailId: number;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  toppings: string[];
}

export interface OrderHistory {
  orderId: number;
  orderCode: string;
  storeName: string;
  storeAddress: string;
  storeImageUrl?: string;
  deliveryAddress: string;
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  completedAt?: string;
  customerNote?: string;
  cancelReason?: string;
  items: OrderHistoryItem[];
}

export interface ShipperTracking {
  shipperId: number;
  shipperName: string;
  shipperPhone: string;
  shipperAvatar?: string;
  vehiclePlate?: string;
  currentLat?: number;
  currentLong?: number;
  formattedAddress?: string;
  lastLocationUpdate?: string;
  isOnline: boolean;
  orderStatus: string;
  deliveryAddress: string;
  distanceToCustomer?: number;
  estimatedArrivalMinutes?: number;
}

class OrderService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Order/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tạo đơn hàng');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async verifyPayment(orderCode: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Order/verify-payment/${orderCode}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể xác thực thanh toán');
      }

      return data.data?.status === 'PAID';
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async getOrderHistory(status?: string, pageNumber: number = 1, pageSize: number = 20): Promise<OrderHistory[]> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (status) params.append('status', status);
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      const url = `${API_URL}/Order/history?${params.toString()}`;
      console.log('Fetching order history from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('Order history response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        let errorMessage = `Không thể lấy lịch sử đơn hàng (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, include the text in error
          if (errorText) {
            errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`;
          }
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        console.log('Empty response, returning empty array');
        return []; // Return empty array if response is empty
      }

      const data = JSON.parse(text);
      console.log('Order history data:', data);
      return data.data || [];
    } catch (error: any) {
      console.error('Error getting order history:', error);
      throw error;
    }
  }

  async getOrderById(orderId: number): Promise<OrderHistory> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Order/${orderId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Không thể lấy chi tiết đơn hàng';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Không có dữ liệu đơn hàng');
      }

      const data = JSON.parse(text);
      return data.data;
    } catch (error: any) {
      console.error('Error getting order by id:', error);
      throw error;
    }
  }

  async getShipperTracking(orderId: number): Promise<ShipperTracking> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Order/${orderId}/track-shipper`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Không thể lấy thông tin shipper';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Không có dữ liệu shipper');
      }

      const data = JSON.parse(text);
      return data.data;
    } catch (error: any) {
      console.error('Error getting shipper tracking:', error);
      throw error;
    }
  }
}

export default new OrderService();
