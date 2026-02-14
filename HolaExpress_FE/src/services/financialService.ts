import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeeConfig {
  name: string;
  type: string;
  value: number;
  unit: string;
  description: string;
  isActive: boolean;
}

export interface UpdateFeeConfig {
  value: number;
  isActive: boolean;
}

export interface DailyRevenue {
  date: string;
  amount: number;
}

export interface TopStore {
  storeId: number;
  storeName: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueStats {
  totalRevenue: number;
  orderRevenue: number;
  deliveryRevenue: number;
  platformFee: number;
  growthRate: number;
  dailyRevenues: DailyRevenue[];
  topStores: TopStore[];
}

export interface ReconciliationItem {
  id: number;
  name: string;
  type: 'store' | 'shipper';
  totalOrders: number;
  totalRevenue: number;
  platformFee: number;
  deliveryFee: number;
  amountToPay: number;
  status: 'pending' | 'processing' | 'completed';
  period: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface UpdateReconciliationStatus {
  status: string;
  adminNote?: string;
}

export interface RefundRequest {
  id: number;
  orderCode: string;
  customerName: string;
  storeName: string;
  orderAmount: number;
  refundAmount: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  adminNote?: string;
  processedAt?: string;
}

export interface ProcessRefund {
  status: string;
  adminNote: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class FinancialService {
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

  async getFeeConfigs(): Promise<ApiResponse<FeeConfig[]>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.get('/financial/fees', {
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
        message: response.data?.message || 'Không thể tải cấu hình phí',
      };
    } catch (error: any) {
      console.error('Error fetching fee configs:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải cấu hình phí',
      };
    }
  }

  async updateFeeConfig(feeType: string, data: UpdateFeeConfig): Promise<ApiResponse<void>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.put(`/financial/fees/${feeType}`, data, {
        headers,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể cập nhật cấu hình phí',
      };
    } catch (error: any) {
      console.error('Error updating fee config:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật cấu hình phí',
      };
    }
  }

  async getRevenueStats(period: string = 'month'): Promise<ApiResponse<RevenueStats>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.get('/financial/revenue/stats', {
        headers,
        params: { period },
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể tải thống kê doanh thu',
      };
    } catch (error: any) {
      console.error('Error fetching revenue stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải thống kê doanh thu',
      };
    }
  }

  async getReconciliations(type: string, status?: string): Promise<ApiResponse<ReconciliationItem[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = { type };
      if (status) params.status = status;
      
      const response = await apiClient.get('/financial/reconciliations', {
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
        message: response.data?.message || 'Không thể tải danh sách đối soát',
      };
    } catch (error: any) {
      console.error('Error fetching reconciliations:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách đối soát',
      };
    }
  }

  async updateReconciliationStatus(
    id: number,
    type: string,
    data: UpdateReconciliationStatus
  ): Promise<ApiResponse<void>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.put(`/financial/reconciliations/${id}?type=${type}`, data, {
        headers,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể cập nhật trạng thái',
      };
    } catch (error: any) {
      console.error('Error updating reconciliation status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái',
      };
    }
  }

  async getRefundRequests(status?: string): Promise<ApiResponse<RefundRequest[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params: any = {};
      if (status) params.status = status;
      
      const response = await apiClient.get('/financial/refunds', {
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
        message: response.data?.message || 'Không thể tải danh sách hoàn tiền',
      };
    } catch (error: any) {
      console.error('Error fetching refund requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách hoàn tiền',
      };
    }
  }

  async processRefund(refundId: number, data: ProcessRefund): Promise<ApiResponse<void>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await apiClient.put(`/financial/refunds/${refundId}`, data, {
        headers,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Không thể xử lý hoàn tiền',
      };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể xử lý hoàn tiền',
      };
    }
  }
}

export default new FinancialService();
