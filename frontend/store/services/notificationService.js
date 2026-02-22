import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const notificationService = {

  getUserNotifications: async (userId) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_NOTIFICATIONS(userId));
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  markAsRead: async (notificationId) => {
    const response = await axiosInstance.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(notificationId));
    return response.data;
  },

  markMultipleAsRead: async (notificationIds) => {
    const promises = notificationIds.map(id => 
      axiosInstance.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(id))
    );
    return Promise.all(promises);
  }
};