import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const depositService = {
  getAllDeposits: async () => {
    try {
      console.log('Fetching all deposits from:', API_ENDPOINTS.GET_ALL_DEPOSITS);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_DEPOSITS);
      console.log('Deposits response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching deposits:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // If 404, the endpoint doesn't exist yet - return empty array
        if (error.response.status === 404) {
          console.log('Deposits endpoint not found, returning empty array');
          return [];
        }
      }
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  },

  getDepositsByAuctionId: async (auctionId) => {
    try {
      console.log(`Fetching deposits for auction ${auctionId}`);
      const url = API_ENDPOINTS.GET_DEPOSITS_BY_AUCTION(auctionId);
      console.log('Request URL:', url);
      const response = await axiosInstance.get(url);
      console.log('Auction deposits response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching deposits by auction:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      return [];
    }
  },

  getDepositById: async (id) => {
    try {
      const url = API_ENDPOINTS.GET_DEPOSIT_BY_ID(id);
      console.log('Fetching deposit by ID:', url);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deposit:', error);
      return null;
    }
  },

  calculateTotalDeposits: (deposits) => {
    if (!deposits || !Array.isArray(deposits)) return 0;
    return deposits.reduce((total, deposit) => total + (deposit.amount || 0), 0);
  },

  getDepositsByType: (deposits, type) => {
    if (!deposits || !Array.isArray(deposits)) return [];
    return deposits.filter(deposit => deposit.type === type);
  }
};