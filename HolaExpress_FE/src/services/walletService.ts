import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export interface Wallet {
  walletId: number;
  userId: number;
  balance: number;
  currency: string;
  updatedAt?: string;
}

export interface Transaction {
  transactionId: number;
  amount: number;
  transactionType: string; // TOP_UP, WITHDRAW, PAYMENT, REFUND
  description: string;
  referenceOrderId?: number;
  createdAt?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface TopUpRequest {
  amount: number;
  paymentMethod: string; // MOMO, ZALOPAY, BANK_TRANSFER
  note?: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccount: string;
  bankName: string;
  note?: string;
}

export interface TopUpPaymentData {
  orderCode: string;
  amount: number;
  description: string;
  checkoutUrl: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  expiresAt: string;
}

class WalletService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getWallet(): Promise<Wallet> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Wallet`, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from wallet API:', text.substring(0, 200));
        throw new Error('Server không phản hồi đúng định dạng. Vui lòng thử lại sau.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy thông tin ví');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }

  async getTransactionHistory(page: number = 1, pageSize: number = 20): Promise<TransactionHistory> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Wallet/transactions?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from transaction API:', text.substring(0, 200));
        throw new Error('Server không phản hồi đúng định dạng. Vui lòng thử lại sau.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy lịch sử giao dịch');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  async topUp(request: TopUpRequest): Promise<TopUpPaymentData> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Wallet/top-up`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Tạo thanh toán thất bại');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async verifyPayment(orderCode: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Wallet/verify-payment/${orderCode}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      return data.success && data.data.status === 'Success';
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async withdraw(request: WithdrawRequest): Promise<Wallet> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Wallet/withdraw`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Rút tiền thất bại');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }
}

export default new WalletService();
