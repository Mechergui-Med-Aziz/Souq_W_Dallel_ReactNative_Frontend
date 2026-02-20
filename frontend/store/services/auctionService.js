import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const auctionService = {
  getAllAuctions: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_AUCTIONS);
    return response.data;
  },

  getAuctionById: async (auctionId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_AUCTION(auctionId));
    return response.data;
  },

  createAuction: async (auctionData, photoFiles = [], userId) => {
    const formData = new FormData();
    
    // Make sure expireDate is properly formatted
    let expireDate = auctionData.expireDate || auctionData.expirationTime;
    
    // Ensure it's a Date object and format it properly
    if (expireDate) {
      const date = new Date(expireDate);
      // MongoDB expects ISO format
      expireDate = date.toISOString();
    } else {
      // Default to 7 days from now if not provided
      expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const auctionObject = {
      title: auctionData.title,
      description: auctionData.description,
      startingPrice: parseFloat(auctionData.startingPrice),
      category: auctionData.category,
      status: 'active',
      bidders: {},
      sellerId: userId,
      expireDate: expireDate // Use the exact field name from backend
    };
    
    console.log('Sending auction object:', JSON.stringify(auctionObject, null, 2)); // Debug log
    
    formData.append('auction', JSON.stringify(auctionObject));
    
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
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Create auction response:', result); // Debug log
    return result;
  },

  updateAuction: async (auctionId, auctionData, photoFiles = [], removedPhotoIds = []) => {
    try {
      // If there are no new photos and no photos to remove, use regular JSON update
      if (photoFiles.length === 0 && removedPhotoIds.length === 0) {
        const response = await axiosInstance.put(
          API_ENDPOINTS.UPDATE_AUCTION(auctionId), 
          auctionData
        );
        return response.data;
      }
      
      // Otherwise use FormData for photo updates
      const formData = new FormData();
      
      // Create auction object with all fields
      const auctionObject = {
        id: auctionId,
        title: auctionData.title,
        description: auctionData.description,
        startingPrice: parseFloat(auctionData.startingPrice),
        category: auctionData.category,
        status: auctionData.status,
        expireDate: auctionData.expireDate,
        sellerId: auctionData.sellerId,
        bidders: auctionData.bidders || {},
        photoId: auctionData.photoId || [] // Keep existing photoIds
      };
      
      formData.append('auction', JSON.stringify(auctionObject));
      
      // Append new photos
      photoFiles.forEach((file, index) => {
        const uriParts = file.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('files', {
          uri: file.uri,
          name: `auction_${Date.now()}_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      // Add removed photo IDs to the request (backend should handle this)
      if (removedPhotoIds.length > 0) {
        formData.append('removedPhotoIds', JSON.stringify(removedPhotoIds));
      }

      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.UPDATE_AUCTION(auctionId)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update auction error:', error);
      throw error;
    }
  },

  deleteAuction: async (auctionId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_AUCTION(auctionId));
    return response.data;
  },

  getUserAuctions: async (userId) => {
    try {
      const url = API_ENDPOINTS.GET_AUCTIONS_BY_SELLER(userId);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user auctions:', error);
      return [];
    }
  },

  getAuctionPhotoUrl: (auctionId, photoId) => {
    if (!photoId) return null;
    return `${API_BASE_URL}${API_ENDPOINTS.GET_AUCTION_PHOTO(auctionId, photoId)}`;
  },
};