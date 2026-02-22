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
    
    let expireDate = auctionData.expireDate || auctionData.expirationTime;
    
    if (expireDate) {
      const date = new Date(expireDate);
      expireDate = date.toISOString();
    } else {
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
      expireDate: expireDate
    };
    
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
    
    return await response.json();
  },

  updateAuction: async (auctionId, auctionData, photoFiles = [], removedPhotoIds = []) => {
    const formData = new FormData();
    
    const auctionObject = {
      id: auctionId,
      title: auctionData.title,
      description: auctionData.description,
      startingPrice: parseFloat(auctionData.startingPrice),
      category: auctionData.category,
      expireDate: auctionData.expireDate,
    };
    
    console.log('Updating auction with object:', auctionObject);
    formData.append('auction', JSON.stringify(auctionObject));
    
    // Append new photos
    if (photoFiles.length > 0) {
      photoFiles.forEach((file, index) => {
        const uriParts = file.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('files', {
          uri: file.uri,
          name: `auction_${Date.now()}_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
    }

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
      console.error('Update auction error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  },

  placeBid: async (auctionId, bidderId, bidAmount) => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.PLACE_BID(auctionId, bidderId, bidAmount)
    );
    return response.data;
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
    return `${API_BASE_URL}${API_ENDPOINTS.GET_AUCTION_PHOTO(auctionId, photoId)}?t=${Date.now()}`;
  },
};