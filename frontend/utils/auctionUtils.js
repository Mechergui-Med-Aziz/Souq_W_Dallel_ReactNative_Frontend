export const checkAndUpdateAuctionStatus = (auction) => {
  if (!auction || !auction.expireDate) return auction;
  
  const now = new Date();
  const expiration = new Date(auction.expireDate);
  
  if (now >= expiration && auction.status !== 'ended') {
    return {
      ...auction,
      status: 'ended'
    };
  }
  
  return auction;
};

export const filterActiveAuctions = (auctions) => {
  const now = new Date();
  return auctions.filter(auction => {
    if (!auction.expireDate) return true;
    const expiration = new Date(auction.expireDate);
    return now < expiration;
  });
};