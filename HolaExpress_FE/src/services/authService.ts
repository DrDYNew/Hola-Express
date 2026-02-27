import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse } from '../types/auth';

// Lấy API URL từ environment variables hoặc dùng giá trị mặc định
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
      
      // Lưu token vào AsyncStorage
      if (response.data.success && response.data.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
      
      // Lưu token vào AsyncStorage
      if (response.data.success && response.data.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },

  getCurrentUser: async (): Promise<LoginResponse | null> => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  getProfile: async (): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.get<ApiResponse<LoginResponse>>('/auth/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  },

  updateProfile: async (data: { fullName: string; phoneNumber?: string }): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.put<ApiResponse<LoginResponse>>('/auth/profile', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  },

  uploadAvatar: async (imageUri: string): Promise<ApiResponse<{ avatarUrl: string }>> => {
    try {
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.([a-zA-Z]+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri: imageUri, name: filename, type } as any);
      const response = await api.put<ApiResponse<{ avatarUrl: string }>>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  },
};
