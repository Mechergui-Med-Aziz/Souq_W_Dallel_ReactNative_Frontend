import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const depositService = {
  getAllDeposits: async () => {
    try {
      console.log('Fetching all deposits from:', API_ENDPOINTS.GET_ALL_DEPOSITS);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_DEPOSITS);
      console.log('Deposits response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching deposits:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      return [];
    }
  },

  getDepositsByAuctionId: async (auctionId) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_DEPOSITS_BY_AUCTION(auctionId));
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching deposits by auction:', error);
      return [];
    }
  },

  getDepositById: async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_DEPOSIT_BY_ID(id));
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