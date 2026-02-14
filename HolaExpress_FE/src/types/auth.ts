export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface LoginResponse {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  username?: string;
  avatarUrl?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
