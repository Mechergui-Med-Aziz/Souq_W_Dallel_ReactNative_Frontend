import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const depositService = {
  getAllDeposits: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_DEPOSITS);
      return response.data;
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return [];
    }
  },

  getDepositsByAuctionId: async (auctionId) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_DEPOSITS_BY_AUCTION(auctionId));
      return response.data;
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