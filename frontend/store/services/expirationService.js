import { store } from '../../store';
import { updateAuctionInStore, processWinner } from '../../store/slices/auctionSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { auctionService } from '../../store/services/auctionService';
import { paymentService } from '../../store/services/paymentService';
let expirationCheckInterval = null;
let processedAuctions = new Set();
let processingAuctions = new Set();

export const startExpirationChecker = () => {
  if (expirationCheckInterval) return;
  
  console.log('Starting expiration checker service');
  
  expirationCheckInterval = setInterval(async () => {
    await checkExpiredAuctions();
  }, 30000);
  
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
    
    const expiredAuctions = auctions.filter(auction => {
      if (!auction.expireDate) return false;
      if (processedAuctions.has(auction.id) || processingAuctions.has(auction.id)) return false;
      if (auction.status === 'ended' || auction.status === 'denied') {
        processedAuctions.add(auction.id);
        return false;
      }
      const expireDate = new Date(auction.expireDate);
      return now >= expireDate;
    });
    
    console.log(`Found ${expiredAuctions.length} expired auctions to process`);
    
    for (const auction of expiredAuctions) {
      if (processingAuctions.has(auction.id)) continue;
      
      processingAuctions.add(auction.id);
      
      try {
        console.log(`Processing expired auction ${auction.id}...`);
        
        await store.dispatch(processWinner(auction.id)).unwrap();
        
        processedAuctions.add(auction.id);
        console.log(`Successfully processed auction ${auction.id}`);
        
        // After processing, clear payment data for the winner if they haven't paid
        const userId = store.getState().auth.user?.id;
        if (userId) {
          const updatedAuction = store.getState().auction.auctions.find(a => a.id === auction.id);
          if (updatedAuction && updatedAuction.bidders) {
            const bids = Object.entries(updatedAuction.bidders);
            if (bids.length > 0) {
              const sortedBids = bids.sort((a, b) => b[1] - a[1]);
              const winnerId = sortedBids[0][0];
              
              if (winnerId === userId) {
                // Clear any stale payment data for this auction
                await paymentService.clearPaymentForAuction(userId, auction.id);
                console.log(`Cleared stale payment data for auction ${auction.id}`);
                
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