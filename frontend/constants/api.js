export const API_BASE_URL = 'http://192.168.100.20:8080';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_ACCOUNT: (email) => `/api/auth/confirmation/${email}`,
  RESEND_CODE: (email) => `/api/auth/confirmation/${email}/resend`,
  RESET_PASSWORD: '/api/reset-password',
  
  // User endpoints
  GET_USER: (id) => `/api/users/id/${id}`,
  UPDATE_USER: (id) => `/api/users/update/${id}`,
  USER_PHOTO: (id) => `/api/users/${id}/photo`,
  DELETE_USER_PHOTO: (id) => `/api/users/${id}/photo`,
  
  // Auction endpoints
  GET_ALL_AUCTIONS: '/api/auctions/all',
  GET_AUCTION: (id) => `/api/auctions/${id}`,
  CREATE_AUCTION: '/api/auctions/create',
  UPDATE_AUCTION: (id) => `/api/auctions/update/${id}`,
  DELETE_AUCTION: (id) => `/api/auctions/delete/${id}`,
  GET_AUCTIONS_BY_SELLER: (sellerId) => `/api/auctions/seller/${sellerId}`,
  GET_AUCTION_PHOTO: (auctionId, photoId) => `/api/auctions/${auctionId}/photos/${photoId}`,
};