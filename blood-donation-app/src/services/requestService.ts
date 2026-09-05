import apiClient from './api';
import { BloodType, UrgencyLevel, RequestStatus } from '../types';

export interface CreateBloodRequestPayload {
  patientName: string;
  bloodGroup: BloodType;
  unitsRequired: number;
  hospitalName: string;
  hospitalLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  urgency: UrgencyLevel;
  requiredDateTime?: string;
  contactNumber: string;
  notes?: string;
}

export const requestService = {
  async createRequest(data: CreateBloodRequestPayload) {
    const response = await apiClient.post('/requests', data);
    return response.data.data;
  },

  async getActiveRequests(bloodGroup?: string, status?: string) {
    const params: any = {};
    if (bloodGroup && bloodGroup !== 'All') params.bloodGroup = bloodGroup;
    if (status) params.status = status;

    const response = await apiClient.get('/requests', { params });
    return response.data.data;
  },

  async getMatchingDonors(bloodGroup: BloodType, radiusKm: number = 10) {
    const response = await apiClient.get('/requests/match/donors', {
      params: { bloodGroup, radius: radiusKm },
    });
    return response.data.data;
  },

  async getMyRequests() {
    const response = await apiClient.get('/requests/user/my-requests');
    return response.data.data;
  },

  async getRequestById(id: string) {
    const response = await apiClient.get(`/requests/${id}`);
    return response.data.data;
  },

  async updateRequestStatus(id: string, status: RequestStatus) {
    const response = await apiClient.patch(`/requests/${id}/status`, { status });
    return response.data.data;
  },
};
