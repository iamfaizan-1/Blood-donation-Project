import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'blood_donation_jwt_token';
const USER_KEY = 'blood_donation_user_data';

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.error('Failed to save token to storage', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to read token from storage', e);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to remove token from storage', e);
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, jsonValue);
      } else {
        await SecureStore.setItemAsync(USER_KEY, jsonValue);
      }
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let jsonValue: string | null = null;
      if (Platform.OS === 'web') {
        jsonValue = localStorage.getItem(USER_KEY);
      } else {
        jsonValue = await SecureStore.getItemAsync(USER_KEY);
      }
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Failed to read user from storage', e);
      return null;
    }
  },

  async removeUser(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      console.error('Failed to remove user from storage', e);
    }
  },
};
