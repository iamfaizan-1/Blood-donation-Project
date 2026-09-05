import apiClient from './api';
import { storage } from '../utils/storage';
import { BloodType } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup: BloodType;
  isDonor?: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterPayload) {
    const response = await apiClient.post('/auth/register', data);
    const resData = response.data?.data || response.data;
    const token = resData?.token;
    const user = resData?.user;
    if (token) {
      await storage.setToken(token);
      await storage.setUser(user);
    }
    return { token, user };
  },

  async login(data: LoginPayload) {
    const response = await apiClient.post('/auth/login', data);
    const resData = response.data?.data || response.data;
    const token = resData?.token;
    const user = resData?.user;
    if (token) {
      await storage.setToken(token);
      await storage.setUser(user);
    }
    return { token, user };
  },

  async logout() {
    await storage.removeToken();
    await storage.removeUser();
  },

  async getCurrentUser() {
    const response = await apiClient.get('/users/me');
    const user = response.data?.data || response.data?.user || response.data;
    if (user) {
      await storage.setUser(user);
    }
    return user;
  },
};
