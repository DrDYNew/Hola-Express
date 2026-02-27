import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data khi app khởi động
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          id: parsedUser.userId?.toString(),
          email: parsedUser.email,
          fullName: parsedUser.fullName,
          username: parsedUser.fullName,
          avatarUrl: parsedUser.avatarUrl,
          phoneNumber: parsedUser.phoneNumber,
          role: parsedUser.role,
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      // Call API to persist changes if fullName is provided
      if (userData.fullName !== undefined) {
        const response = await authService.updateProfile({
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
        });
        if (response.success && response.data) {
          const updatedUser: User = {
            id: user?.id ?? '',
            email: response.data.email,
            fullName: response.data.fullName,
            phoneNumber: response.data.phoneNumber,
            avatarUrl: response.data.avatarUrl,
            role: response.data.role,
          };
          setUser(updatedUser);
          // Update AsyncStorage
          const storedData = await AsyncStorage.getItem('userData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            await AsyncStorage.setItem('userData', JSON.stringify({
              ...parsedData,
              fullName: response.data.fullName,
              phoneNumber: response.data.phoneNumber,
              avatarUrl: response.data.avatarUrl,
            }));
          }
          return;
        }
        throw new Error(response.message || 'Không thể cập nhật thông tin');
      }
      // Local update only (e.g. avatarUrl)
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser as User);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        await AsyncStorage.setItem('userData', JSON.stringify({
          ...parsedData,
          fullName: updatedUser.fullName,
          avatarUrl: updatedUser.avatarUrl,
          phoneNumber: updatedUser.phoneNumber,
        }));
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        loading, 
        login, 
        logout, 
        updateUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
