import { store } from '../../store';
import { updateAuctionInStore, processWinner } from '../../store/slices/auctionSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { auctionService } from '../../store/services/auctionService';

let expirationCheckInterval = null;
let processedAuctions = new Set();

// Keep track of which auctions we're currently processing to avoid duplicates
let processingAuctions = new Set();

export const startExpirationChecker = () => {
  if (expirationCheckInterval) return;
  
  console.log('Starting expiration checker service');
  
  // Check every 30 seconds (instead of 30 to reduce frequency)
  expirationCheckInterval = setInterval(async () => {
    await checkExpiredAuctions();
  }, 30000); // 30 seconds
  
  // Run immediately on start
  checkExpiredAuctions();
};

export const stopExpirationChecker = () => {
  if (expirationCheckInterval) {
    clearInterval(expirationCheckInterval);
    expirationCheckInterval = null;
    processedAuctions.clear();
    processingAuctions.clear();
    console.log('Stopped expiration checker');
  }
};

const checkExpiredAuctions = async () => {
  try {
    const state = store.getState();
    const auctions = state.auction.auctions;
    const now = new Date();
    
    console.log(`Checking ${auctions.length} auctions for expiration`);
    
    // Find expired auctions that haven't been processed
    const expiredAuctions = auctions.filter(auction => {
      if (!auction.expireDate) return false;
      
      // Skip if already processed or being processed
      if (processedAuctions.has(auction.id) || processingAuctions.has(auction.id)) return false;
      
      // Skip if already ended or denied
      if (auction.status === 'ended' || auction.status === 'denied') {
        processedAuctions.add(auction.id);
        return false;
      }
      
      const expireDate = new Date(auction.expireDate);
      return now >= expireDate;
    });
    
    console.log(`Found ${expiredAuctions.length} expired auctions to process`);
    
    // Process each expired auction one by one
    for (const auction of expiredAuctions) {
      if (processingAuctions.has(auction.id)) continue;
      
      processingAuctions.add(auction.id);
      
      try {
        console.log(`Processing expired auction ${auction.id}...`);
        
        // Call backend to process winner - this will update the auction status
        await store.dispatch(processWinner(auction.id)).unwrap();
        
        // Mark as processed
        processedAuctions.add(auction.id);
        console.log(`Successfully processed auction ${auction.id}`);
        
        // Refresh notifications for the current user if they're the winner
        const userId = store.getState().auth.user?.id;
        if (userId) {
          // Check if this user is the winner
          const updatedAuction = store.getState().auction.auctions.find(a => a.id === auction.id);
          if (updatedAuction && updatedAuction.bidders) {
            const bids = Object.entries(updatedAuction.bidders);
            if (bids.length > 0) {
              const sortedBids = bids.sort((a, b) => b[1] - a[1]);
              const winnerId = sortedBids[0][0];
              
              if (winnerId === userId) {
                // Small delay to allow backend to create notification
                setTimeout(() => {
                  store.dispatch(fetchNotifications(userId));
                }, 2000);
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing auction ${auction.id}:`, error);
        // Remove from processing set to allow retry later
        processingAuctions.delete(auction.id);
      }
    }
    
  } catch (error) {
    console.error('Error in expiration checker:', error);
  }
};

export const clearProcessedAuctions = () => {
  processedAuctions.clear();
  processingAuctions.clear();
  console.log('Cleared processed auctions sets');
};