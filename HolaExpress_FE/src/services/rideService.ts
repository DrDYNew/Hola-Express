import apiClient from './api';

export interface NearbyDriver {
  userId: number;
  fullName: string;
  rating: number;
  totalTrips: number;
  vehicleType: string; // 'MOTORCYCLE' | 'CAR'
  vehiclePlate: string;
  vehicleName?: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  distanceKm: number;
  avatarUrl?: string;
}

export interface RideBookingRecord {
  rideBookingId: number;
  bookingCode: string;
  customerId: number;
  driverId?: number;
  driverName?: string;
  vehiclePlate?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleType: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  fare: number;
  status: 'pending' | 'accepted' | 'arriving' | 'onway' | 'completed' | 'cancelled';
  cancelReason?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const rideService = {
  /** GET /api/ride/nearby-drivers */
  getNearbyDrivers: async (
    lat: number,
    lng: number,
    radiusKm: number = 5,
    vehicleType?: string,
  ): Promise<ApiResponse<NearbyDriver[]>> => {
    try {
      const params: Record<string, string | number> = { lat, lng, radiusKm };
      if (vehicleType) params.vehicleType = vehicleType;

      const response = await apiClient.get('/ride/nearby-drivers', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải danh sách tài xế',
      };
    }
  },

  /** POST /api/ride/book – lưu chuyến vào DB */
  bookRide: async (payload: {
    driverUserId: number;
    vehicleType: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    distanceKm: number;
    fare: number;
  }): Promise<ApiResponse<RideBookingRecord>> => {
    try {
      const response = await apiClient.post('/ride/book', payload);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể đặt xe',
      };
    }
  },

  /** GET /api/ride/history */
  getRideHistory: async (): Promise<ApiResponse<RideBookingRecord[]>> => {
    try {
      const response = await apiClient.get('/ride/history');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tải lịch sử',
      };
    }
  },

  /** POST /api/ride/{id}/cancel */
  cancelRide: async (rideBookingId: number, reason?: string): Promise<ApiResponse<null>> => {
    try {
      await apiClient.post(`/ride/${rideBookingId}/cancel`, { reason });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể hủy chuyến',
      };
    }
  },

  // ── Driver-side ──────────────────────────────────────────────────────

  /** GET /api/ride/driver/requests – chuyến pending gán cho tài xế */
  getDriverRequests: async (): Promise<ApiResponse<RideBookingRecord[]>> => {
    try {
      const response = await apiClient.get('/ride/driver/requests');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Không thể tải yêu cầu' };
    }
  },

  /** GET /api/ride/driver/active – chuyến đang chạy của tài xế */
  getDriverActiveRides: async (): Promise<ApiResponse<RideBookingRecord[]>> => {
    try {
      const response = await apiClient.get('/ride/driver/active');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Không thể tải chuyến đang chạy' };
    }
  },

  /** POST /api/ride/{id}/accept – tài xế xác nhận nhận chuyến */
  acceptRide: async (rideBookingId: number): Promise<ApiResponse<null>> => {
    try {
      await apiClient.post(`/ride/${rideBookingId}/accept`);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Không thể nhận chuyến' };
    }
  },

  /** POST /api/ride/{id}/update-status – cập nhật trạng thái (arriving|onway|completed) */
  updateRideStatus: async (rideBookingId: number, status: 'arriving' | 'onway' | 'completed'): Promise<ApiResponse<null>> => {
    try {
      await apiClient.post(`/ride/${rideBookingId}/update-status`, { status });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Không thể cập nhật trạng thái' };
    }
  },

  /** GET /api/ride/driver/history – lịch sử chuyến hoàn thành/hủy của tài xế */
  getDriverRideHistory: async (): Promise<ApiResponse<RideBookingRecord[]>> => {
    try {
      const response = await apiClient.get('/ride/driver/history');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Không thể tải lịch sử' };
    }
  },
};

export default rideService;
