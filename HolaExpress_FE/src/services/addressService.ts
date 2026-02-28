import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://103.57.223.209:5110/api';

export interface Address {
  addressId?: number;
  userId?: number;
  addressText: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  isDefault?: boolean;
}

export interface AddAddressRequest {
  addressText: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  isDefault?: boolean;
}

class AddressService {
  private async parseJsonResponse(response: Response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error('Non-JSON response from address API:', text.substring(0, 200));
      throw new Error('Server khong phan hoi dung dinh dang. Vui long thu lai sau.');
    }
  }

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getUserAddresses(): Promise<Address[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address`, {
        method: 'GET',
        headers,
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy danh sách địa chỉ');
      }

      return data.data || [];
    } catch (error: any) {
      console.error('Error getting addresses:', error);
      throw error;
    }
  }

  async getAddressById(addressId: number): Promise<Address> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address/${addressId}`, {
        method: 'GET',
        headers,
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy thông tin địa chỉ');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error getting address:', error);
      throw error;
    }
  }

  async addAddress(address: AddAddressRequest): Promise<Address> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address`, {
        method: 'POST',
        headers,
        body: JSON.stringify(address),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể thêm địa chỉ');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  async updateAddress(addressId: number, address: AddAddressRequest): Promise<Address> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address/${addressId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(address),
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật địa chỉ');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  async deleteAddress(addressId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address/${addressId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa địa chỉ');
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  async setDefaultAddress(addressId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/Address/${addressId}/set-default`, {
        method: 'PATCH',
        headers,
      });

      const data = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt địa chỉ mặc định');
      }
    } catch (error: any) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }

  async searchAddress(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_URL}/Maps/autocomplete?input=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return [];
      }

      return data.predictions || [];
    } catch (error: any) {
      console.error('Error searching address:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_URL}/Maps/place-details?placeId=${placeId}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Không thể lấy thông tin địa điểm');
      }

      return data.result;
    } catch (error: any) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await fetch(
        `${API_URL}/Maps/geocode?address=${encodeURIComponent(address)}`
      );

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        // Return default location (Hanoi) if geocoding fails
        return { lat: 21.0285, lng: 105.8542 };
      }

      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch (error: any) {
      console.error('Error geocoding address:', error);
      return { lat: 21.0285, lng: 105.8542 };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `${API_URL}/Maps/reverse-geocode?lat=${latitude}&lng=${longitude}`
      );

      if (!response.ok) {
        return 'Vui lòng chọn địa chỉ trên bản đồ';
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formattedAddress || 'Vui lòng chọn địa chỉ trên bản đồ';
      }

      return 'Vui lòng chọn địa chỉ trên bản đồ';
    } catch (error: any) {
      return 'Vui lòng chọn địa chỉ trên bản đồ';
    }
  }
}

export default new AddressService();
