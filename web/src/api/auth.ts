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

export const authApi = {
  login: (data: Record<string, any>) => 
    apiClient<AuthResult>("/auth/login", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    
  register: (data: Record<string, any>) => 
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
};
