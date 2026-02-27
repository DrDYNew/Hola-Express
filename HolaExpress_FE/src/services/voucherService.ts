import apiClient from './api';

export interface Voucher {
  voucherId: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  storeId?: number;
  storeName?: string;
}

export interface VoucherValidationResponse {
  success: boolean;
  message: string;
  discount: number;
  voucher: Voucher;
}

class VoucherService {
  /**
   * Lấy danh sách voucher có sẵn
   */
  async getAvailableVouchers(storeId?: number): Promise<Voucher[]> {
    try {
      const response = await apiClient.get('/vouchers', {
        params: {
          ...(storeId && { storeId })
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available vouchers:', error);
      throw error;
    }
  }

  /**
   * Lấy voucher của cửa hàng cụ thể
   */
  async getStoreVouchers(storeId: number): Promise<Voucher[]> {
    try {
      const response = await apiClient.get(`/vouchers/store/${storeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching store vouchers:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra và áp dụng voucher
   */
  async validateVoucher(
    code: string,
    orderAmount: number,
    storeId?: number
  ): Promise<VoucherValidationResponse> {
    try {
      const response = await apiClient.post('/vouchers/validate', {
        code: code.toUpperCase(),
        orderAmount,
        ...(storeId && { storeId })
      });
      return response.data;
    } catch (error: any) {
      // Return error response from server
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Không thể kiểm tra voucher');
      }
      throw error;
    }
  }

  /**
   * Format voucher text
   */
  formatVoucherDiscount(voucher: Voucher): string {
    if (voucher.discountType === 'PERCENTAGE') {
      return `${voucher.discountValue}%`;
    }
    return `${(voucher.discountValue || 0).toLocaleString('vi-VN')}đ`;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Check if voucher is valid
   */
  isVoucherValid(voucher: Voucher): boolean {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);

    return (
      voucher.isActive &&
      startDate <= now &&
      endDate > now &&
      (!voucher.usageLimit || (voucher.usedCount || 0) < voucher.usageLimit)
    );
  }

  /**
   * Check if voucher is expired
   */
  isVoucherExpired(voucher: Voucher): boolean {
    const now = new Date();
    const endDate = new Date(voucher.endDate);
    return endDate <= now;
  }

  /**
   * Get days remaining
   */
  getDaysRemaining(endDate: string): number {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

const voucherService = new VoucherService();
export default voucherService;
