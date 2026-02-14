import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AdminDashboardStats {
  totalUsers: number;
  usersChange: number;
  totalStores: number;
  storesChange: number;
  totalOrders: number;
  ordersChange: number;
  totalRevenue: number;
  revenueChange: number;
  activeShippers: number;
  shippersChange: number;
  pendingOrders: number;
  pendingChange: number;
  todayRevenue: number;
  todayOrders: number;
  totalProducts: number;
  productsChange: number;
}

export interface UserSummary {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export interface StoreSummary {
  storeId: number;
  storeName: string;
  ownerName: string;
  status: string;
  totalOrders: number;
  revenue: number;
  rating: number;
  createdAt: string;
}

export interface OrderSummary {
  orderId: number;
  orderCode: string;
  customerName: string;
  storeName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  shipperId?: number;
  shipperName?: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  recentUsers: UserSummary[];
  recentStores: StoreSummary[];
  recentOrders: OrderSummary[];
  revenueChart: RevenueData[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class AdminService {
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

  async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.get('/admin/dashboard', {
        headers,
      });

      // Backend returns: { success: true, data: { stats, recentUsers, ... } }
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải dữ liệu dashboard',
      };
    } catch (error: any) {
      console.error('Error fetching admin dashboard:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải dữ liệu dashboard',
      };
    }
  }

  async getStats(): Promise<ApiResponse<AdminDashboardStats>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.get('/admin/dashboard/stats', {
        headers,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải thống kê',
      };
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải thống kê',
      };
    }
  }

  async getUsers(page: number = 1, limit: number = 10, role?: string): Promise<ApiResponse<{ users: UserSummary[], total: number, page: number, limit: number, totalPages: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { page, limit };
      if (role) params.role = role;
      
      const response = await apiClient.get('/admin/users', {
        headers,
        params,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải danh sách người dùng',
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách người dùng',
      };
    }
  }

  async getStores(page: number = 1, limit: number = 10): Promise<ApiResponse<{ stores: StoreSummary[], total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.get('/admin/stores', {
        headers,
        params: { page, limit },
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải danh sách cửa hàng',
      };
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách cửa hàng',
      };
    }
  }

  async getOrders(page: number = 1, limit: number = 10, status?: string): Promise<ApiResponse<{ orders: OrderSummary[], total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { page, limit };
      if (status) params.status = status;
      
      const response = await apiClient.get('/admin/orders', {
        headers,
        params,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải danh sách đơn hàng',
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách đơn hàng',
      };
    }
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.put(`/admin/users/${userId}/status`, 
        { isActive },
        { headers }
      );

      return {
        success: true,
        data: response.data,
        message: 'Cập nhật trạng thái thành công',
      };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái',
      };
    }
  }

  async updateStoreStatus(storeId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.put(`/admin/stores/${storeId}/status`, 
        { status },
        { headers }
      );

      return {
        success: true,
        data: response.data,
        message: 'Cập nhật trạng thái cửa hàng thành công',
      };
    } catch (error: any) {
      console.error('Error updating store status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái cửa hàng',
      };
    }
  }

  formatCurrencyVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'DELIVERED':
        return '#10b981';
      case 'PENDING':
      case 'PROCESSING':
        return '#f59e0b';
      case 'INACTIVE':
      case 'CANCELLED':
      case 'REJECTED':
        return '#ef4444';
      case 'DELIVERING':
      case 'PREPARING':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'PENDING':
        return 'Chờ xử lý';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'PREPARING':
        return 'Đang chuẩn bị';
      case 'DELIVERING':
        return 'Đang giao';
      case 'DELIVERED':
        return 'Đã giao';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return status;
    }
  }
}

const adminService = new AdminService();
export default adminService;
