import apiClient from './api';

export interface DonorClusterDTO {
  clusterId: number;
  centerLatitude: number;
  centerLongitude: number;
  donorCount: number;
  dominantBloodGroup: string | null;
}

export interface DemandPatternDTO {
  bloodGroup: string;
  urgency: string;
  frequency: number;
  supportPercent: number;
  avgFulfillmentHours: number | null;
}

export interface DataMiningInsights {
  generatedAt: string;
  totalDonorsAnalyzed: number;
  totalRequestsAnalyzed: number;
  donorClusters: DonorClusterDTO[];
  demandPatterns: DemandPatternDTO[];
  topInsight: string;
}

export const analyticsService = {
  async getInsights(): Promise<DataMiningInsights> {
    const response = await apiClient.get('/analytics/insights');
    return response.data.data;
  },
};
