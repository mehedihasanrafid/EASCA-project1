import { apiClient } from "./client";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profileImageUrl: string | null;
  isActive: boolean;
  role: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string; // serialized as string from JSON
}

export interface AuthResult {
  user: User;
  accessToken: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export const authApi = {
  login: (data: LoginInput) =>
    apiClient<AuthResult>("/auth/login", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    
  register: (data: RegisterInput) =>
    apiClient<{ user: User; developmentVerificationToken?: string }>("/auth/register", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    
  refresh: () => 
    apiClient<AuthResult>("/auth/refresh", { 
      method: "POST" 
    }),
    
  logout: () => 
    apiClient<void>("/auth/logout", { 
      method: "POST" 
    }),
    
  logoutAll: () => 
    apiClient<void>("/auth/logout-all", { 
      method: "POST" 
    }),
    
  me: () => 
    apiClient<{ user: User }>("/auth/me", { 
      method: "GET" 
    }),

  verifyEmail: (token: string) =>
    apiClient<void>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    apiClient<void>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    apiClient<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiClient<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};
