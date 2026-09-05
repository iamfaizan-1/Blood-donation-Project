import apiClient from './api';

export const donationService = {
  async createDonation(requestId: string) {
    const response = await apiClient.post('/donations', { requestId });
    return response.data.data;
  },

  async completeDonation(donationId: string) {
    const response = await apiClient.patch(`/donations/${donationId}/complete`);
    return response.data.data;
  },

  async getDonationHistory() {
    const response = await apiClient.get('/donations/history');
    return response.data.data;
  },
};
