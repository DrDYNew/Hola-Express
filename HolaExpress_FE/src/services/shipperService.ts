import apiClient from './api';

export interface ShipperStats {
  todayEarnings: number;
  completedToday: number;
  activeOrders: number;
  totalDeliveries: number;
  averageRating: number;
}

export interface ShipperOrder {
  orderId: number;
  orderCode: string;
  storeName: string;
  storeAddress: string;
  storeLatitude?: number;
  storeLongitude?: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  totalAmount: number;
  deliveryFee: number;
  status: string;
  pickupTime?: string;
  createdAt: string;
  notes?: string;
}

export interface ShipperDashboardData {
  stats: ShipperStats;
  currentOrders: ShipperOrder[];
}

export interface ShipperEarnings {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
  totalDeliveries: number;
  dailyBreakdown: {
    date: string;
    earnings: number;
    deliveriesCount: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ShipperService {
  async getDashboard(): Promise<ApiResponse<ShipperDashboardData>> {
    try {
      const response = await apiClient.get('/shipper/dashboard');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải dữ liệu dashboard',
      };
    }
  }

  async getCurrentOrders(): Promise<ApiResponse<ShipperOrder[]>> {
    try {
      const response = await apiClient.get('/shipper/orders/current');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải đơn hàng hiện tại',
      };
    }
  }

  async getAvailableOrders(latitude: number, longitude: number, radius: number = 5000): Promise<ApiResponse<ShipperOrder[]>> {
    try {
      const response = await apiClient.get('/shipper/orders/available', {
        params: { latitude, longitude, radius },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải đơn hàng khả dụng',
      };
    }
  }

  async getOrderHistory(page: number = 1, pageSize: number = 20): Promise<ApiResponse<ShipperOrder[]>> {
    try {
      const response = await apiClient.get('/shipper/orders/history', {
        params: { page, pageSize },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải lịch sử đơn hàng',
      };
    }
  }

  async getEarnings(): Promise<ApiResponse<ShipperEarnings>> {
    try {
      const response = await apiClient.get('/shipper/earnings');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải thông tin thu nhập',
      };
    }
  }

  async updateStatus(isOnline: boolean, latitude?: number, longitude?: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.patch('/shipper/status', {
        isOnline,
        latitude,
        longitude,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái',
      };
    }
  }

  async acceptOrder(orderId: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/shipper/orders/${orderId}/accept`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể nhận đơn hàng',
      };
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.patch(`/shipper/orders/${orderId}/status`, { status });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng',
      };
    }
  }

  formatCurrencyVND(amount: number): string {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  }
}

export default new ShipperService();
