export const API_BASE_URL = 'http://192.168.1.4:8080';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_ACCOUNT: (email) => `/api/auth/confirmation/${email}`,
  VALIDATE_ACCOUNT: (email) => `/api/auth/validate/${email}`,
  RESEND_CODE: (email) => `/api/auth/confirmation/${email}/resend`,
  RESET_PASSWORD: '/api/reset-password',
  UPDATE_PASSWORD: (password) => `/api/user/update-password/${password}`,
  
  // User endpoints
  GET_USER: (id) => `/api/users/id/${id}`,
  UPDATE_USER: (id) => `/api/users/update/${id}`,
  USER_PHOTO: (id) => `/api/users/${id}/photo`,
  DELETE_USER_PHOTO: (id) => `/api/users/${id}/photo`,
  GET_ALL_USERS: '/api/users/all',
  
  // Auction endpoints
  GET_ALL_AUCTIONS: '/api/auctions/all',
  GET_AUCTION: (id) => `/api/auctions/${id}`,
  CREATE_AUCTION: '/api/auctions/create',
  UPDATE_AUCTION: (id) => `/api/auctions/update/${id}`,
  DELETE_AUCTION: (id) => `/api/auctions/delete/${id}`,
  GET_AUCTIONS_BY_SELLER: (sellerId) => `/api/auctions/seller/${sellerId}`,
  GET_AUCTIONS_BY_STATUS: (status) => `/api/auctions/auctions/${status}`,
  GET_AUCTION_PHOTO: (auctionId, photoId) => `/api/auctions/${auctionId}/photos/${photoId}`,
  PLACE_BID: (auctionId, bidderId, bidAmount) => `/api/auctions/bid/add/${auctionId}/${bidderId}/${bidAmount}`,
  
  // Review endpoints
  ADD_REVIEW: (auctionId, reviewerId, review) => `/api/auctions/auction/addReview/${auctionId}/${reviewerId}/${review}`,
  GET_REVIEWS: (auctionId) => `/api/auctions/auction/reviews/${auctionId}`,
  
  // Admin auction actions
  UPDATE_AUCTION_STATUS: (auctionId, adminId, status) => `/api/auctions/auction/${auctionId}/${adminId}/${status}`,
  
  // Auction winner
  PROCESS_WINNER: (auctionId) => `/api/auctions/auction/ended/${auctionId}`,
  
  // Deposit endpoints
  GET_ALL_DEPOSITS: '/api/auctionsdeposits/getAll',
  GET_DEPOSITS_BY_AUCTION: (auctionId) => `/api/auctionsdeposits/getByAuctionId?auctionId=${auctionId}`,
  GET_DEPOSIT_BY_ID: (id) => `/api/auctionsdeposits/id/${id}`,
  
  // Notification endpoints
  GET_NOTIFICATIONS: (userId) => `/api/notifications/${userId}`,
  MARK_NOTIFICATION_READ: (id) => `/api/notifications/read/${id}`,
  
  // Payment endpoints
  CREATE_PAYMENT_INTENT: '/api/payment/pay1dt',
  PAY_AUCTION: (auctionId, amount) => `/api/payment/payAuction/${auctionId}/${amount}`,
};