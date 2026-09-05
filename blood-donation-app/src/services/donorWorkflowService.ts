import apiClient from './api';
import { DonorNotification, AcceptedRequestDetails } from '../types';

export const donorWorkflowService = {
  /**
   * Get pending request notifications for current logged-in donor
   */
  getMyNotifications: async (): Promise<DonorNotification[]> => {
    const response = await apiClient.get('/donor-workflow/notifications');
    return response.data.data;
  },

  /**
   * Donor accepts a blood request notification
   */
  acceptRequest: async (
    notificationId: string
  ): Promise<{
    donation: any;
    request: any;
    requesterContact: { name: string; phone: string };
  }> => {
    const response = await apiClient.post(`/donor-workflow/accept/${notificationId}`);
    return response.data.data;
  },

  /**
   * Donor declines a blood request notification
   */
  declineRequest: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/donor-workflow/decline/${notificationId}`);
  },

  /**
   * Get accepted request details including secure contact info
   */
  getRequestDetails: async (requestId: string): Promise<AcceptedRequestDetails> => {
    const response = await apiClient.get(`/donor-workflow/request-details/${requestId}`);
    return response.data.data;
  },

  /**
   * Advance request status through workflow lifecycle
   */
  advanceStatus: async (
    requestId: string,
    status: 'contact_established' | 'on_the_way' | 'fulfilled' | 'closed'
  ): Promise<any> => {
    const response = await apiClient.patch(`/donor-workflow/advance/${requestId}`, { status });
    return response.data.data;
  },

  /**
   * Notify matched donors for a request
   */
  notifyMatchedDonors: async (requestId: string): Promise<any> => {
    const response = await apiClient.post(`/donor-workflow/notify/${requestId}`);
    return response.data.data;
  },
};

export default donorWorkflowService;
