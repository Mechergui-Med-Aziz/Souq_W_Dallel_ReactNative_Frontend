import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { depositService } from './depositService';

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
      console.log(`Checking if user ${userId} has paid for auction ${auctionId}`);
      const paymentsData = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      const payments = paymentsData ? JSON.parse(paymentsData) : {};
      
      const userPayments = payments[userId] || [];
      const hasPaid = userPayments.includes(auctionId);
      console.log(`Payment status for auction ${auctionId}: ${hasPaid}`);
      return hasPaid;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  },

  checkBackendPaymentStatus: async (auctionId) => {
    try {
      console.log(`Checking backend payment status for auction ${auctionId}`);
      const deposits = await depositService.getDepositsByAuctionId(auctionId);
      console.log('Deposits found:', deposits);
      
      const auctionPayment = deposits.find(d => d.type === 'AUCTION');
      
      if (auctionPayment) {
        console.log('Found AUCTION deposit, payment was made');
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          await paymentService.markAsPaidForAuction(userObj.id, auctionId);
        }
        return true;
      }
      console.log('No AUCTION deposit found, payment not made');
      return false;
    } catch (error) {
      console.error('Error checking backend payment status:', error);
      return false;
    }
  },

  markAsPaidForAuction: async (userId, auctionId) => {
    try {
      console.log(`Marking auction ${auctionId} as paid for user ${userId}`);
      const paymentsData = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      const payments = paymentsData ? JSON.parse(paymentsData) : {};
      
      const userPayments = payments[userId] || [];
      
      if (!userPayments.includes(auctionId)) {
        userPayments.push(auctionId);
        payments[userId] = userPayments;
        await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
        console.log(`Successfully marked auction ${auctionId} as paid`);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking payment:', error);
      return false;
    }
  },

};