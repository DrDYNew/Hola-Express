// Types cho chức năng đăng ký làm đối tác (Shipper/Owner)

export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'OTHER';

export const VehicleTypeLabels: Record<VehicleType, string> = {
  MOTORCYCLE: 'Xe máy',
  CAR: 'Ô tô',
  OTHER: 'Loại khác'
};

export interface ApplyShipperRequest {
  licenseNumber: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  vehicleTypeOther?: string; // Tên loại xe khi chọn OTHER
  notes?: string;
  // Document Media IDs - BẮT BUỘC
  idCardFrontMediaId: number;
  idCardBackMediaId: number;
  licenseFrontMediaId: number;
  licenseBackMediaId: number;
}

export interface ApplyOwnerRequest {
  businessName: string;
  businessAddress: string;
  businessLicense: string;
  taxCode?: string;
  notes?: string;
  // Document Media IDs - BẮT BUỘC
  idCardFrontMediaId: number;
  idCardBackMediaId: number;
  businessLicenseMediaId: number;
  taxCodeMediaId: number;
}

export interface PartnerApplication {
  applicationId: number;
  userId: number;
  userName: string;
  requestedRole: 'SHIPPER' | 'OWNER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Shipper fields
  licenseNumber?: string;
  vehiclePlate?: string;
  vehicleType?: VehicleType;
  
  // Owner fields
  businessName?: string;
  businessAddress?: string;
  businessLicense?: string;
  taxCode?: string;
  
  // Common fields
  notes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  
  // Document URLs
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  businessLicenseDocumentUrl?: string;
  taxCodeDocumentUrl?: string;
  
  // Document Media IDs
  idCardFrontMediaId?: number;
  idCardBackMediaId?: number;
  licenseFrontMediaId?: number;
  licenseBackMediaId?: number;
  businessLicenseMediaId?: number;
  taxCodeMediaId?: number;
  
  applicationDate: string;
  processedDate?: string;
  processedBy?: number;
  processedByName?: string;
}

export interface ProcessApplicationRequest {
  applicationId: number;
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  rejectionReason?: string;
}

export type PartnerType = 'SHIPPER' | 'OWNER';

export const PartnerTypeLabels: Record<PartnerType, string> = {
  SHIPPER: 'Tài xế giao hàng',
  OWNER: 'Chủ cửa hàng'
};

export const ApplicationStatusLabels: Record<PartnerApplication['status'], string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Đã từ chối'
};

export const ApplicationStatusColors: Record<PartnerApplication['status'], string> = {
  PENDING: '#FFA500',
  APPROVED: '#4CAF50',
  REJECTED: '#F44336'
};
