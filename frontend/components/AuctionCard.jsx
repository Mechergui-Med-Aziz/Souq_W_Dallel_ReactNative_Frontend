import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import ThemedText from './ThemedText';
import ThemedCard from './ThemedCard';
import { Colors } from '../constants/Colors';
import { auctionService } from '../store/services/auctionService';
import { userService } from '../store/services/userService';

const categories = {
  'electronics': { label: 'Électronique', icon: 'tv-outline' },
  'furniture': { label: 'Meubles', icon: 'bed-outline' },
  'vehicles': { label: 'Véhicules', icon: 'car-outline' },
  'real-estate': { label: 'Immobilier', icon: 'home-outline' },
  'collectibles': { label: 'Collection', icon: 'albums-outline' },
  'art': { label: 'Art', icon: 'color-palette-outline' },
  'jewelry': { label: 'Bijoux', icon: 'diamond-outline' },
  'clothing': { label: 'Vêtements', icon: 'shirt-outline' },
  'sports': { label: 'Sports', icon: 'basketball-outline' },
  'general': { label: 'Général', icon: 'apps-outline' },
};

const AuctionCard = ({ auction, onPress }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    loadAuctionData();
    if (auction?.expireDate) {
      checkExpiration();
      const timer = setInterval(checkExpiration, 60000); // Check every minute
      return () => clearInterval(timer);
    }
  }, [auction]);

  const checkExpiration = () => {
    if (!auction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(auction.expireDate);
    const expired = now >= expiration;
    
    setIsExpired(expired);
    
    if (!expired) {
      calculateTimeRemaining();
    } else {
      setTimeRemaining('Expiré');
    }
  };

  const calculateTimeRemaining = () => {
    if (!auction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(auction.expireDate);
    
    if (now >= expiration) {
      setTimeRemaining('Expiré');
      setIsExpired(true);
      return;
    }
    
    const diffMs = expiration - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      setTimeRemaining(`${diffDays}j ${diffHours}h`);
    } else if (diffHours > 0) {
      setTimeRemaining(`${diffHours}h ${diffMinutes}m`);
    } else {
      setTimeRemaining(`${diffMinutes}m`);
    }
  };

  const loadAuctionData = async () => {
    // Load auction photo
    if (auction?.photoId?.[0]) {
      const url = auctionService.getAuctionPhotoUrl(auction.id, auction.photoId[0]);
      setPhotoUrl(url);
    }

    // Load seller details
    await loadSellerDetails();
  };

  const loadSellerDetails = async () => {
    try {
      const sellerId = auction.sellerId;
      if (sellerId) {
        const seller = await userService.getUserById(sellerId);
        setSellerDetails(seller);
      } else {
        setSellerDetails(null);
      }
    } catch (error) {
      console.error('Error loading seller details:', error);
      setSellerDetails(null);
    }
  };

  const formatPrice = (price) => {
    return `${price?.toFixed(2) || '0.00'} TND`;
  };

  const getStatusColor = (status) => {
    if (isExpired) return '#ef4444';
    
    switch (status?.toLowerCase()) {
      case 'active': return '#4ade80';
      case 'pending': return '#fbbf24';
      case 'ended': return '#ef4444';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    if (isExpired) return 'Expiré';
    return auction.status || 'Actif';
  };

  const getSellerName = () => {
    if (!sellerDetails) return 'Vendeur inconnu';
    return `${sellerDetails.firstname || ''} ${sellerDetails.lastname || ''}`.trim() || sellerDetails.email || 'Inconnu';
  };

  const getSellerInitial = () => {
    if (!sellerDetails) return 'U';
    const name = sellerDetails.firstname || sellerDetails.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getCategoryInfo = () => {
    if (!auction?.category) return null;
    return categories[auction.category] || categories.general;
  };

  const formatExpirationDate = () => {
    if (!auction?.expireDate) return 'Date non définie';
    const date = new Date(auction.expireDate);
    return date.toLocaleDateString('fr-FR') + ' ' + 
           date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const categoryInfo = getCategoryInfo();

  // Don't render if expired (optional - remove this if you want to show expired auctions)
  // if (isExpired) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <ThemedCard style={styles.card} elevated>
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.auctionImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image" size={40} color="#ccc" />
            </View>
          )}
          
          <View style={styles.topBadges}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(auction.status) }]}>
              <ThemedText style={styles.statusText}>
                {getStatusText()}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.bidCountBadge}>
            <Ionicons name="people" size={14} color="#fff" />
            <ThemedText style={styles.bidCountText}>
              {auction.bidders ? Object.keys(auction.bidders).length : 0}
            </ThemedText>
          </View>

          
        </View>
        
        <View style={styles.detailsContainer}>
          <ThemedText title style={styles.auctionTitle} numberOfLines={1}>
            {auction.title || 'Sans titre'}
          </ThemedText>
          
          <ThemedText style={styles.auctionDescription} numberOfLines={2}>
            {auction.description || 'Aucune description'}
          </ThemedText>
          
          <View style={styles.priceContainer}>
            <View>
              <ThemedText style={styles.startingPriceLabel}>
                Prix de départ
              </ThemedText>
              <ThemedText title style={styles.startingPrice}>
                {formatPrice(auction.startingPrice)}
              </ThemedText>
            </View>

            {timeRemaining && (
              <View style={[styles.timeBadge, isExpired && styles.expiredBadge]}>
                <Ionicons 
                  name={isExpired ? "close-circle" : "time-outline"} 
                  size={12} 
                  color="#fff" 
                />
                <ThemedText style={styles.timeBadgeText}>
                  {timeRemaining}
                </ThemedText>
              </View>
            )}

          </View>
          
          <View style={styles.footer}>
            <View style={styles.sellerContainer}>
              <View style={styles.sellerAvatar}>
                <ThemedText style={styles.sellerInitial}>
                  {getSellerInitial()}
                </ThemedText>
              </View>
              <View style={styles.sellerInfo}>
                <ThemedText style={styles.sellerLabel}>
                  Vendeur
                </ThemedText>
                <ThemedText style={styles.sellerName} numberOfLines={1}>
                  {getSellerName()}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ThemedCard>
    </TouchableOpacity>
  );
};

export default AuctionCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: 15,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  auctionImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bidCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bidCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadge: {
    backgroundColor: '#ef4444',
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsContainer: {
    paddingHorizontal: 5,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  auctionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  startingPriceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  startingPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  expirationText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
  },
});