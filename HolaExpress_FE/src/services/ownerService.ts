import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DashboardStats {
  todayRevenue: number;
  todayRevenueChange: number;
  newOrdersCount: number;
  newOrdersChange: number;
  totalProductsSold: number;
  productsSoldChange: number;
  averageRating: number;
  ratingChange: number;
  newCustomers: number;
  newCustomersChange: number;
  lowStockItems: number;
  lowStockChange: number;
}

export interface RecentOrder {
  orderId: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  status: string;
  statusText: string;
  createdAt: string;
  icon: string;
  color: string;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  imageUrl?: string;
  totalSold: number;
  revenue: number;
}

export interface OwnerDashboard {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  topProducts: TopSellingProduct[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class OwnerService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async getDashboard(storeId?: number): Promise<ApiResponse<OwnerDashboard>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = storeId ? { storeId } : {};
      
      const response = await apiClient.get<OwnerDashboard>('/owner/dashboard', {
        headers,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải dữ liệu dashboard',
      };
    }
  }

  async getStats(storeId?: number): Promise<ApiResponse<DashboardStats>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = storeId ? { storeId } : {};
      
      const response = await apiClient.get<DashboardStats>('/owner/dashboard/stats', {
        headers,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải thống kê',
      };
    }
  }

  async getRecentOrders(storeId?: number, limit: number = 10): Promise<ApiResponse<RecentOrder[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { limit };
      if (storeId) params.storeId = storeId;
      
      const response = await apiClient.get<RecentOrder[]>('/owner/dashboard/recent-orders', {
        headers,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải đơn hàng',
      };
    }
  }

  async getTopProducts(storeId?: number, limit: number = 5): Promise<ApiResponse<TopSellingProduct[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { limit };
      if (storeId) params.storeId = storeId;
      
      const response = await apiClient.get<TopSellingProduct[]>('/owner/dashboard/top-products', {
        headers,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải sản phẩm bán chạy',
      };
    }
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  }

  formatCurrencyVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  }

  async getRevenueReport(period: string = 'today', storeId?: number): Promise<ApiResponse<RevenueReportData>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { period };
      if (storeId) params.storeId = storeId;
      
      const response = await apiClient.get<RevenueReportData>('/owner/revenue-report', {
        headers,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching revenue report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải báo cáo doanh thu',
      };
    }
  }
}

export interface RevenueReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProducts: {
    productId: number;
    productName: string;
    imageUrl?: string;
    totalSold: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export default new OwnerService();
