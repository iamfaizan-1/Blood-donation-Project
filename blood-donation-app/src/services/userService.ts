import apiClient from './api';
import { storage } from '../utils/storage';
import { BloodType } from '../types';

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  bloodGroup?: BloodType;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export const userService = {
  async getProfile() {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfilePayload) {
    const response = await apiClient.put('/users/profile', data);
    const updatedUser = response.data.data;
    if (updatedUser) {
      await storage.setUser(updatedUser);
    }
    return updatedUser;
  },

  async updateAvailability(isAvailable: boolean) {
    const response = await apiClient.patch('/users/availability', { isAvailable });
    const updatedUser = response.data.data;
    if (updatedUser) {
      await storage.setUser(updatedUser);
    }
    return updatedUser;
  },

  async registerPushToken(pushToken: string) {
    const response = await apiClient.post('/users/push-token', { pushToken });
    return response.data.data;
  },
};
