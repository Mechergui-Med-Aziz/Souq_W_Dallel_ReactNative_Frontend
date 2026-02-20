import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAuctionById } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';
import { auctionService } from '../../store/services/auctionService';
import { userService } from '../../store/services/userService';

const { width: screenWidth } = Dimensions.get('window');

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

const AuctionDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { currentAuction, loading } = useAppSelector((state) => state.auction);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [auctionPhotos, setAuctionPhotos] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [sellerDetails, setSellerDetails] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (id) {
      loadAuction();
    }
  }, [id]);

  useEffect(() => {
    if (currentAuction) {
      // Load auction photos
      if (currentAuction.photoId?.length > 0) {
        const photos = currentAuction.photoId.map(photoId => 
          auctionService.getAuctionPhotoUrl(currentAuction.id, photoId)
        );
        setAuctionPhotos(photos);
      }

      // Load seller details
      loadSellerDetails();

      // Calculate time remaining and check expiration
      if (currentAuction.expireDate) {
        checkExpiration();
        const timer = setInterval(checkExpiration, 60000); // Update every minute
        return () => clearInterval(timer);
      }
    }
  }, [currentAuction]);

  const checkExpiration = () => {
    if (!currentAuction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(currentAuction.expireDate);
    const expired = now >= expiration;
    
    setIsExpired(expired);
    
    if (!expired) {
      calculateTimeRemaining();
    } else {
      setTimeRemaining('Expiré');
    }
  };

  const calculateTimeRemaining = () => {
    if (!currentAuction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(currentAuction.expireDate);
    
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
      setTimeRemaining(`${diffDays}j ${diffHours}h restantes`);
    } else if (diffHours > 0) {
      setTimeRemaining(`${diffHours}h ${diffMinutes}m restantes`);
    } else {
      setTimeRemaining(`${diffMinutes}m restantes`);
    }
  };

  const loadSellerDetails = async () => {
    try {
      if (currentAuction?.sellerId) {
        const seller = await userService.getUserById(currentAuction.sellerId);
        setSellerDetails(seller);
      }
    } catch (error) {
      console.error('Error loading seller details:', error);
      setSellerDetails(null);
    }
  };

  const loadAuction = async () => {
    try {
      await dispatch(fetchAuctionById(id)).unwrap();
    } catch (error) {
      Alert.alert('Erreur', 'Échec du chargement des détails de l\'enchère');
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
    return currentAuction?.status || 'Actif';
  };

  const formatExpirationDate = (isoString) => {
    if (!isoString) return 'Aucune date d\'expiration';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR') + ' à ' + 
           date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLongDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryInfo = () => {
    if (!currentAuction?.category) return null;
    return categories[currentAuction.category] || categories.general;
  };

  const getSellerName = () => {
    if (!sellerDetails) return 'Vendeur inconnu';
    return `${sellerDetails.firstname || ''} ${sellerDetails.lastname || ''}`.trim() || sellerDetails.email || 'Inconnu';
  };

  const getSellerInitial = () => {
    if (!sellerDetails) return 'V';
    const name = sellerDetails.firstname || sellerDetails.email || 'Vendeur';
    return name.charAt(0).toUpperCase();
  };

  if (loading || !currentAuction) {
    return (
      <ThemedView safe style={styles.loadingContainer}>
        <ThemedText>Chargement des détails...</ThemedText>
      </ThemedView>
    );
  }

  const categoryInfo = getCategoryInfo();

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle} numberOfLines={1}>
              Détails de l'enchère
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </View>

        {auctionPhotos.length > 0 ? (
          <>
            <View style={styles.mainImageContainer}>
              <Image 
                source={{ uri: auctionPhotos[activeImageIndex] }} 
                style={styles.mainImage}
                resizeMode="cover"
              />
              
              {auctionPhotos.length > 1 && (
                <View style={styles.imageCounter}>
                  <ThemedText style={styles.imageCounterText}>
                    {activeImageIndex + 1} / {auctionPhotos.length}
                  </ThemedText>
                </View>
              )}

              {/* Status Badge on Image */}
              <View style={[styles.imageStatusBadge, { backgroundColor: getStatusColor(currentAuction.status) }]}>
                <ThemedText style={styles.imageStatusText}>
                  {getStatusText()}
                </ThemedText>
              </View>
            </View>
            
            {auctionPhotos.length > 1 && (
              <View style={styles.thumbnailContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailScrollContent}
                >
                  {auctionPhotos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.thumbnail,
                        activeImageIndex === index && styles.thumbnailActive
                      ]}
                      onPress={() => setActiveImageIndex(index)}
                    >
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image" size={80} color="#ccc" />
            <ThemedText style={styles.noImageText}>Aucune image disponible</ThemedText>
          </View>
        )}

        <View style={styles.content}>
          <ThemedCard style={styles.infoCard}>
            <View style={styles.titleRow}>
              <ThemedText title style={styles.auctionTitle}>
                {currentAuction.title}
              </ThemedText>
            </View>

            {/* Category Display */}
            {categoryInfo && (
              <View style={styles.categoryContainer}>
                <Ionicons name={categoryInfo.icon} size={18} color={Colors.primary} />
                <ThemedText style={styles.categoryText}>
                  {categoryInfo.label}
                </ThemedText>
              </View>
            )}

            <View style={styles.priceSection}>
              <View>
                <ThemedText style={styles.priceLabel}>Prix de départ</ThemedText>
                <ThemedText title style={styles.price}>
                  {formatPrice(currentAuction.startingPrice)}
                </ThemedText>
              </View>
            </View>

            {/* Simple expiration container (keep for backward compatibility) */}
            <View style={[styles.expirationContainer, isExpired && styles.expiredContainer]}>
              <Ionicons 
                name={isExpired ? "alert-circle" : "calendar"} 
                size={16} 
                color={isExpired ? "#fff" : "#666"} 
              />
              <ThemedText style={[styles.expirationText, isExpired && styles.expiredText]}>
                {isExpired ? 'Enchère terminée' : `Se termine : ${formatExpirationDate(currentAuction.expireDate)}`}
              </ThemedText>
            </View>

            <View style={styles.descriptionSection}>
              <ThemedText style={styles.sectionTitle}>Description</ThemedText>
              <ThemedText style={styles.description}>
                {currentAuction.description || 'Aucune description disponible.'}
              </ThemedText>
            </View>

            <View style={styles.sellerSection}>
              <ThemedText style={styles.sectionTitle}>Informations du vendeur</ThemedText>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <ThemedText style={styles.sellerInitial}>
                    {getSellerInitial()}
                  </ThemedText>
                </View>
                <View style={styles.sellerDetails}>
                  <ThemedText style={styles.sellerName}>
                    {getSellerName()}
                  </ThemedText>
                  <ThemedText style={styles.sellerEmail}>
                    {sellerDetails?.email || 'Email non disponible'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Bid Count */}
            <View style={styles.bidSection}>
              <View style={styles.bidCountContainer}>
                <Ionicons name="people" size={20} color={Colors.primary} />
                <ThemedText style={styles.bidCountText}>
                  {currentAuction.bidders ? Object.keys(currentAuction.bidders).length : 0} enchères placées
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={40} />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default AuctionDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  mainImageContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageStatusBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  thumbnailScrollContent: {
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: Colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    marginTop: 10,
    opacity: 0.7,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
  },
  titleRow: {
    marginBottom: 15,
  },
  auctionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  expiredTimeSection: {
    backgroundColor: '#ef4444',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  expiredTimeText: {
    color: '#fff',
  },
  expirationDetailContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    gap: 15,
  },
  expirationDetailText: {
    flex: 1,
  },
  expirationDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  expirationDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  expirationDetailTime: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  expiredContainer: {
    backgroundColor: '#ef4444',
  },
  expirationText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  expiredText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  descriptionSection: {
    marginBottom: 25,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  sellerSection: {
    marginBottom: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sellerInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  bidSection: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bidCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidCountText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
});