import apiClient from './api';
import { 
  ApplyShipperRequest, 
  ApplyOwnerRequest,
  PartnerApplication,
  ProcessApplicationRequest
} from '../types/partner';
import { ApiResponse } from '../types/auth';

class PartnerService {
  /**
   * Đăng ký làm tài xế giao hàng (Shipper)
   */
  async applyForShipper(data: ApplyShipperRequest): Promise<PartnerApplication> {
    const response = await apiClient.post<ApiResponse<PartnerApplication>>(
      '/RoleApplication/apply-shipper',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Đăng ký thất bại');
    }
    
    return response.data.data;
  }

  /**
   * Đăng ký làm chủ cửa hàng (Owner)
   */
  async applyForOwner(data: ApplyOwnerRequest): Promise<PartnerApplication> {
    const response = await apiClient.post<ApiResponse<PartnerApplication>>(
      '/RoleApplication/apply-owner',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Đăng ký thất bại');
    }
    
    return response.data.data;
  }

  /**
   * Lấy danh sách đơn đăng ký của tôi
   */
  async getMyApplications(): Promise<PartnerApplication[]> {
    const response = await apiClient.get<ApiResponse<PartnerApplication[]>>(
      '/RoleApplication/my-applications'
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể lấy danh sách đơn');
    }
    
    return response.data.data;
  }

  /**
   * Lấy chi tiết đơn đăng ký
   */
  async getApplicationById(applicationId: number): Promise<PartnerApplication> {
    const response = await apiClient.get<ApiResponse<PartnerApplication>>(
      `/RoleApplication/${applicationId}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không tìm thấy đơn đăng ký');
    }
    
    return response.data.data;
  }

  /**
   * [ADMIN] Lấy tất cả đơn đang chờ duyệt
   */
  async getPendingApplications(): Promise<PartnerApplication[]> {
    const response = await apiClient.get<ApiResponse<PartnerApplication[]>>(
      '/RoleApplication/admin/pending'
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể lấy danh sách đơn');
    }
    
    return response.data.data;
  }

  /**
   * [ADMIN] Lấy đơn theo trạng thái
   */
  async getApplicationsByStatus(status: string): Promise<PartnerApplication[]> {
    const response = await apiClient.get<ApiResponse<PartnerApplication[]>>(
      `/RoleApplication/admin/by-status/${status}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể lấy danh sách đơn');
    }
    
    return response.data.data;
  }

  /**
   * [ADMIN] Duyệt hoặc từ chối đơn đăng ký
   */
  async processApplication(data: ProcessApplicationRequest): Promise<PartnerApplication> {
    const response = await apiClient.post<ApiResponse<PartnerApplication>>(
      '/RoleApplication/admin/process',
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Xử lý đơn thất bại');
    }
    
    return response.data.data;
  }
}

export default new PartnerService();
