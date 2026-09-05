import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';
import { userService, UpdateProfilePayload } from '../services/userService';
import { storage } from '../utils/storage';
import { setUnauthorizedCallback } from '../services/api';
import { notificationService } from '../services/notificationService';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  isDonor: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UpdateProfilePayload) => Promise<User>;
  updateAvailability: (isAvailable: boolean) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Auth State from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          // Fetch fresh profile from backend
          try {
            const freshUser = await authService.getCurrentUser();
            if (freshUser) {
              setUser(freshUser);
            }
          } catch (e) {
            console.log('Backend unreachable or token expired, using offline user');
          }
        }
      } catch (error) {
        console.error('Error initializing AuthState', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Attach 401 Unauthorized handler
    setUnauthorizedCallback(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      setToken(res.token);
      setUser(res.user);
      notificationService.syncPushTokenWithBackend();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setToken(res.token);
      setUser(res.user);
      notificationService.syncPushTokenWithBackend();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Error during logout:', e);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (data: UpdateProfilePayload): Promise<User> => {
    const updated = await userService.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const updateAvailability = async (isAvailable: boolean): Promise<User> => {
    const updated = await userService.updateAvailability(isAvailable);
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    try {
      const freshUser = await userService.getProfile();
      if (freshUser) setUser(freshUser);
    } catch (e) {
      console.log('Failed to refresh user profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
        updateAvailability,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
