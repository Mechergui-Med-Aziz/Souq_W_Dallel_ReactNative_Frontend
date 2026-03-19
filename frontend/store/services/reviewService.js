import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const reviewService = {
  getReviews: async (auctionId) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_REVIEWS(auctionId));
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {};
    }
  },

  addReview: async (auctionId, reviewerId, review) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.ADD_REVIEW(auctionId, reviewerId, review)
    );
    return response.data;
  },

  // Note: Add backend endpoints for Update and delete reviews
};