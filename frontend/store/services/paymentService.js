import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYMENT_STORAGE_KEY = 'auctionPayments';

export const paymentService = {
  createPaymentIntent: async () => {
    try {
      console.log('Calling payment endpoint:', API_ENDPOINTS.CREATE_PAYMENT_INTENT);
      const response = await axiosInstance.post(API_ENDPOINTS.CREATE_PAYMENT_INTENT);
      console.log('Payment response:', response.data);
      
      if (!response.data || !response.data.clientSecret) {
        throw new Error('Invalid payment response from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Payment intent error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur de paiement');
    }
  },

  // Pay for won auction
  payAuction: async (auctionId, amount) => {
    try {
      console.log(`Paying auction ${auctionId} with amount ${amount}`);
      console.log('Full URL:', `${API_BASE_URL}${API_ENDPOINTS.PAY_AUCTION(auctionId, amount)}`);
      
      const response = await axiosInstance.post(
        API_ENDPOINTS.PAY_AUCTION(auctionId, amount)
      );
      
      console.log('Pay auction response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Auction payment error:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        throw new Error(error.response.data?.error || error.response.data?.message || 'Erreur de paiement');
      }
      throw new Error(error.message || 'Erreur de paiement');
    }
  },

  hasPaidForAuction: async (userId, auctionId) => {
    try {
      const paymentsData = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      const payments = paymentsData ? JSON.parse(paymentsData) : {};
      
      const userPayments = payments[userId] || [];
      return userPayments.includes(auctionId);
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  },

  markAsPaidForAuction: async (userId, auctionId) => {
    try {
      const paymentsData = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      const payments = paymentsData ? JSON.parse(paymentsData) : {};
      
      const userPayments = payments[userId] || [];
      
      if (!userPayments.includes(auctionId)) {
        userPayments.push(auctionId);
        payments[userId] = userPayments;
        await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
      }
      
      return true;
    } catch (error) {
      console.error('Error marking payment:', error);
      return false;
    }
  },

  clearAllPayments: async () => {
    try {
      await AsyncStorage.removeItem(PAYMENT_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing payments:', error);
      return false;
    }
  }
};