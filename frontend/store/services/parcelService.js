import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';

export const parcelService = {
  getAllParcels: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_PARCELS);
      return response.data;
    } catch (error) {
      console.error('Error fetching parcels:', error);
      return [];
    }
  },

  getParcelById: async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_PARCEL_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching parcel:', error);
      return null;
    }
  },

  updateParcel: async (id, parcelData) => {
    try {
      console.log('Updating parcel:', id, 'with data:', parcelData);
      const response = await axiosInstance.put(
        API_ENDPOINTS.UPDATE_PARCEL(id),
        parcelData
      );
      console.log('Update parcel response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating parcel:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  updateParcelQuality: async (id, isValid, description = '') => {
    try {
      let url = API_ENDPOINTS.UPDATE_PARCEL_QUALITY(id, isValid, description);
      console.log('Updating parcel quality with URL:', url);
      
      const response = await axiosInstance.put(url);
      console.log('Update quality response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating parcel quality:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  getParcelsByAdmin: async (adminId) => {
    try {
      console.log('Fetching parcels for admin:', adminId);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_PARCELS_BY_ADMIN(adminId));
      console.log('Parcels response data:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching admin parcels:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      return [];
    }
  },

  getParcelsByTransporter: async (transporterId) => {
    try {
      console.log('Fetching parcels for transporter:', transporterId);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_PARCELS_BY_TRANSPORTER(transporterId));
      console.log('Transporter parcels response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching transporter parcels:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      return [];
    }
  },

  getParcelsByBuyer: async (buyerId) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_PARCELS_BY_BUYER(buyerId));
      return response.data;
    } catch (error) {
      console.error('Error fetching buyer parcels:', error);
      return [];
    }
  },

  deliverParcel: async (id) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.DELIVER_PARCEL(id));
      return response.data;
    } catch (error) {
      console.error('Error delivering parcel:', error);
      throw error;
    }
  },

  assignTransporter: async (id, transporterId) => {
    try {
      return await parcelService.updateParcel(id, { transporterId });
    } catch (error) {
      console.error('Error assigning transporter:', error);
      throw error;
    }
  },
};