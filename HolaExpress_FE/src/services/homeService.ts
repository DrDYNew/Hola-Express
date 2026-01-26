import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.50.100:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  color?: string;
  productCount?: number;
}

export interface Product {
  productId: number;
  productName: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  categoryId: number;
  storeId: number;
  isAvailable: boolean;
  rating?: number;
  discount?: number;
}

export interface Store {
  storeId: number;
  storeName: string;
  address?: string;
  phoneNumber?: string;
  imageUrl?: string;
  rating?: number;
  deliveryTime?: string;
  distance?: number;
  tags?: string[];
  discount?: string;
}

export interface Banner {
  bannerId: number;
  imageUrl: string;
  title?: string;
  link?: string;
  isActive: boolean;
}

const homeService = {
  // Get categories (hàng đầu - 4 categories chính)
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Categories API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching categories:', error);
      }
      return [];
    }
  },

  // Get utilities (hàng thứ 2 - tiện ích: Giao nhanh, Gần bạn, Ưu đãi, Đánh giá cao)
  getUtilities: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/utilities');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Utilities API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching utilities:', error);
      }
      return [];
    }
  },

  // Get stores (restaurants)
  getStores: async (params?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    search?: string;
  }): Promise<Store[]> => {
    try {
      const response = await api.get('/stores', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Stores API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching stores:', error);
      }
      return [];
    }
  },

  // Get products (for flash sale, recommendations)
  getProducts: async (params?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    isFlashSale?: boolean;
    storeId?: number;
  }): Promise<Product[]> => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Products API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching products:', error);
      }
      return [];
    }
  },

  // Get flash sale products
  getFlashSaleProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/products/flash-sale');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Flash sale API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching flash sale products:', error);
      }
      return [];
    }
  },

  // Get recommended products based on time
  getRecommendedProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/products/recommended');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Recommended products API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching recommended products:', error);
      }
      return [];
    }
  },

  // Get banners
  getBanners: async (): Promise<Banner[]> => {
    try {
      const response = await api.get('/banners');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Banners API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching banners:', error);
      }
      return [];
    }
  },

  // Get nearby stores
  getNearbyStores: async (latitude: number, longitude: number): Promise<Store[]> => {
    try {
      const response = await api.get('/stores/nearby', {
        params: { latitude, longitude },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Nearby stores API not implemented yet, using fallback data');
      } else {
        console.error('Error fetching nearby stores:', error);
      }
      return [];
    }
  },
};

export default homeService;
