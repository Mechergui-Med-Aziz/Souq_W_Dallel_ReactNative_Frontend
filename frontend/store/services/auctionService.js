import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from './userService';

export const auctionService = {
  getAllAuctions: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_AUCTIONS);
    return response.data;
  },

  getAuctionById: async (auctionId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_AUCTION(auctionId));
    return response.data;
  },

  createAuction: async (auctionData, photoFiles = [], currentUser) => {
    const formData = new FormData();
    
    // Create seller object from current user
    const sellerObject = {
      id: currentUser.id,
      firstname: currentUser.firstname || '',
      lastname: currentUser.lastname || '',
      email: currentUser.email,
      role: currentUser.role || 'User'
    };
    
    // Create auction object with seller
    const auctionObject = {
      title: auctionData.title,
      description: auctionData.description,
      startingPrice: parseFloat(auctionData.startingPrice),
      Category: auctionData.category,
      status: 'active',
      bidders: {}, // Empty bidders object
      seller: sellerObject // Include seller in the auction
    };
    
    formData.append('auction', JSON.stringify(auctionObject));
    
    // Append all photos
    photoFiles.forEach((file, index) => {
      const uriParts = file.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('files', {
        uri: file.uri,
        name: `auction_${Date.now()}_${index}.${fileType}`,
        type: `image/${fileType}`,
      });
    });

    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.CREATE_AUCTION}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  },

  updateAuction: async (auctionId, auctionData) => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.UPDATE_AUCTION(auctionId), 
      auctionData
    );
    return response.data;
  },

  deleteAuction: async (auctionId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_AUCTION(auctionId));
    return response.data;
  },

  getUserAuctions: async (userId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_AUCTIONS_BY_SELLER(userId));
    return response.data;
  },

  getAuctionPhotoUrl: (auctionId, photoId) => {
    if (!photoId) return null;
    return `${API_BASE_URL}${API_ENDPOINTS.GET_AUCTION_PHOTO(auctionId, photoId)}`;
  },
};