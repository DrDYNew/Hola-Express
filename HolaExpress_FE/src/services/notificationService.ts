import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface NotificationItem {
  notiId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | null;
}

const notificationService = {
  getNotifications: async (page = 1, pageSize = 20): Promise<{ list: NotificationItem[]; unreadCount: number }> => {
    try {
      const res = await api.get('/notification', { params: { page, pageSize } });
      return { list: res.data.data ?? [], unreadCount: res.data.unreadCount ?? 0 };
    } catch {
      return { list: [], unreadCount: 0 };
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await api.get('/notification/unread-count');
      return res.data.data ?? 0;
    } catch {
      return 0;
    }
  },

  markRead: async (id: number): Promise<void> => {
    try { await api.put(`/notification/${id}/read`); } catch {}
  },

  markAllRead: async (): Promise<void> => {
    try { await api.put('/notification/read-all'); } catch {}
  },

  delete: async (id: number): Promise<void> => {
    try { await api.delete(`/notification/${id}`); } catch {}
  },
};

export default notificationService;
