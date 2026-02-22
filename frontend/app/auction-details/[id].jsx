import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAuctionById, placeBid } from '../../store/slices/auctionSlice';
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
  const { currentAuction, loading, placingBid } = useAppSelector((state) => state.auction);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [auctionPhotos, setAuctionPhotos] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [timeRemainingDetailed, setTimeRemainingDetailed] = useState('');
  const [sellerDetails, setSellerDetails] = useState(null);
  const [sellerPhotoUrl, setSellerPhotoUrl] = useState(null);
  const [sellerPhotoRefreshing, setSellerPhotoRefreshing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isLastHour, setIsLastHour] = useState(false);
  const [bidders, setBidders] = useState([]);
  const [bidderNames, setBidderNames] = useState({});
  const [highestBid, setHighestBid] = useState(0);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isHighestBidder, setIsHighestBidder] = useState(false);
  const [userBid, setUserBid] = useState(0);
  const [userParticipated, setUserParticipated] = useState(false);
  const [userWon, setUserWon] = useState(false);

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

      // Process bidders
      processBidders();

      // Load seller details
      loadSellerDetails();

      // Calculate time remaining
      if (currentAuction.expireDate) {
        checkExpiration();
      }
    }
  }, [currentAuction]);

  useEffect(() => {
    if (sellerDetails?.photoId) {
      loadSellerPhoto();
    } else {
      setSellerPhotoUrl(null);
    }
  }, [sellerDetails]);

  // Countdown timer effect
  useEffect(() => {
    if (currentAuction?.expireDate && !isExpired) {
      checkExpiration();
      // Update more frequently in last hour (every second)
      const interval = isLastHour ? 1000 : 60000;
      const timer = setInterval(checkExpiration, interval);
      return () => clearInterval(timer);
    }
  }, [currentAuction, isLastHour, isExpired]);

  const loadBidderNames = async (biddersArray) => {
    const names = {};
    for (const bidder of biddersArray) {
      if (bidder.userId && !names[bidder.userId]) {
        try {
          const user = await userService.getUserById(bidder.userId);
          const displayName = user?.firstname && user?.lastname 
            ? `${user.firstname} ${user.lastname}`.trim()
            : user?.email?.split('@')[0] || 'Utilisateur';
          names[bidder.userId] = displayName;
        } catch (error) {
          names[bidder.userId] = 'Utilisateur';
        }
      }
    }
    setBidderNames(names);
  };

  const processBidders = () => {
    if (currentAuction?.bidders) {
      const biddersArray = Object.entries(currentAuction.bidders).map(([userId, amount]) => ({
        userId,
        amount,
        isCurrentUser: userId === user?.id
      })).sort((a, b) => b.amount - a.amount);
      
      setBidders(biddersArray);
      loadBidderNames(biddersArray);
      
      if (biddersArray.length > 0) {
        setHighestBid(biddersArray[0].amount);
        setIsHighestBidder(biddersArray[0].userId === user?.id);
      } else {
        setHighestBid(currentAuction.startingPrice || 0);
        setIsHighestBidder(false);
      }
      
      const userBidObj = biddersArray.find(b => b.userId === user?.id);
      setUserBid(userBidObj?.amount || 0);
      setUserParticipated(!!userBidObj);
    }
  };

  const loadSellerPhoto = async () => {
    if (!sellerDetails?.photoId) {
      setSellerPhotoUrl(null);
      return;
    }

    try {
      setSellerPhotoRefreshing(true);
      const photoUrl = `${userService.getUserPhotoUrl(sellerDetails.id, sellerDetails.photoId)}?t=${Date.now()}`;
      setSellerPhotoUrl(photoUrl);
    } catch (error) {
      console.error('Error loading seller photo:', error);
      setSellerPhotoUrl(null);
    } finally {
      setSellerPhotoRefreshing(false);
    }
  };

  const checkExpiration = () => {
    if (!currentAuction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(currentAuction.expireDate);
    const expired = now >= expiration;
    
    setIsExpired(expired);
    
    if (!expired) {
      calculateTimeRemaining();
      // Check if it's in the last hour
      const diffHours = (expiration - now) / (1000 * 60 * 60);
      setIsLastHour(diffHours <= 1);
    } else {
      setTimeRemaining('Expiré');
      setTimeRemainingDetailed('Enchère terminée');
      setIsLastHour(false);
      
      // Check if user won or lost
      if (user && bidders.length > 0) {
        const highestBidder = bidders[0];
        setUserWon(highestBidder.userId === user.id);
      }
    }
  };

  const calculateTimeRemaining = () => {
    if (!currentAuction?.expireDate) return;
    
    const now = new Date();
    const expiration = new Date(currentAuction.expireDate);
    
    if (now >= expiration) {
      setTimeRemaining('Expiré');
      setTimeRemainingDetailed('Enchère terminée');
      setIsExpired(true);
      return;
    }
    
    const diffMs = expiration - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    // Detailed format for countdown
    if (diffDays > 0) {
      setTimeRemainingDetailed(`${diffDays}j ${diffHours}h ${diffMinutes}m`);
    } else if (diffHours > 0) {
      setTimeRemainingDetailed(`${diffHours}h ${diffMinutes}m ${diffSeconds}s`);
    } else {
      setTimeRemainingDetailed(`${diffMinutes}m ${diffSeconds}s`);
    }
    
    // Short format for badge
    if (diffDays > 0) {
      setTimeRemaining(`${diffDays}j ${diffHours}h`);
    } else if (diffHours > 0) {
      setTimeRemaining(`${diffHours}h ${diffMinutes}m`);
    } else {
      setTimeRemaining(`${diffMinutes}m`);
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
      Alert.alert('Erreur', 'Échec du chargement des détails');
    }
  };

  const handlePlaceBid = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour enchérir');
      return;
    }
    
    if (isExpired) {
      Alert.alert('Enchère terminée', 'Cette enchère est expirée');
      return;
    }

    if (currentAuction.sellerId === user.id) {
      Alert.alert('Action non autorisée', 'Vous ne pouvez pas enchérir sur votre propre enchère');
      return;
    }

    const minBid = highestBid + 1;
    setBidAmount(minBid.toString());
    setShowBidModal(true);
  };

  const submitBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = highestBid + 1;

    if (amount < minBid) {
      Alert.alert('Montant invalide', `Votre enchère doit être d'au moins ${minBid} TND`);
      return;
    }

    try {
      await dispatch(placeBid({
        auctionId: id,
        bidderId: user.id,
        bidAmount: amount
      })).unwrap();

      setShowBidModal(false);
      setBidAmount('');
      
      // Refresh auction data
      await dispatch(fetchAuctionById(id)).unwrap();
      
      Alert.alert('Succès', 'Votre enchère a été placée avec succès');
      
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Échec du placement de l\'enchère');
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
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
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

        {/* Images Section */}
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
            <ThemedText style={styles.noImageText}>Aucune image</ThemedText>
          </View>
        )}

        <View style={styles.content}>
          <ThemedCard style={styles.infoCard}>
            <View style={styles.titleRow}>
              <ThemedText title style={styles.auctionTitle}>
                {currentAuction.title}
              </ThemedText>
            </View>

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
              {timeRemaining && !isExpired && (
                <View style={[styles.timeBadge, isLastHour && styles.lastHourBadge]}>
                  <Ionicons 
                    name={isLastHour ? "alert-circle" : "time-outline"} 
                    size={16} 
                    color="#fff" 
                  />
                  <ThemedText style={styles.timeBadgeText}>
                    {timeRemaining}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Last hour countdown */}
            {isLastHour && !isExpired && (
              <View style={styles.countdownContainer}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <ThemedText style={styles.countdownText}>
                  Dernière heure ! {timeRemainingDetailed}
                </ThemedText>
              </View>
            )}

            <View style={styles.highestBidSection}>
              <ThemedText style={styles.highestBidLabel}>
                Enchère la plus élevée
              </ThemedText>
              <View style={styles.highestBidContainer}>
                <ThemedText title style={styles.highestBid}>
                  {formatPrice(highestBid)}
                </ThemedText>
                {isHighestBidder && !isExpired && (
                  <View style={styles.bestBidderBadge}>
                    <Ionicons name="trophy" size={16} color="#fff" />
                    <ThemedText style={styles.bestBidderText}>
                      Vous êtes le meilleur enchérisseur
                    </ThemedText>
                  </View>
                )}
                {isExpired && userParticipated && (
                  <View style={[styles.resultBadge, userWon ? styles.wonBadge : styles.lostBadge]}>
                    <Ionicons 
                      name={userWon ? "trophy" : "close-circle"} 
                      size={16} 
                      color="#fff" 
                    />
                    <ThemedText style={styles.resultBadgeText}>
                      {userWon ? 'Enchère gagnée' : 'Enchère perdue'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Bidders List */}
            {bidders.length > 0 && (
              <View style={styles.biddersSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color={Colors.primary} />
                  <ThemedText style={styles.sectionTitle}>
                    Enchérisseurs ({bidders.length})
                  </ThemedText>
                </View>
                
                {bidders.map((bidder, index) => (
                  <View key={bidder.userId} style={styles.bidderItem}>
                    <View style={styles.bidderRank}>
                      {index === 0 ? (
                        <Ionicons name="trophy" size={20} color="#fbbf24" />
                      ) : (
                        <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
                      )}
                    </View>
                    <View style={styles.bidderInfo}>
                      <ThemedText style={[
                        styles.bidderName,
                        bidder.isCurrentUser && styles.currentUserText
                      ]}>
                        {bidder.isCurrentUser ? 'Vous' : (bidderNames[bidder.userId] || 'Utilisateur')}
                      </ThemedText>
                      {bidder.isCurrentUser && (
                        <View style={styles.yourBidBadge}>
                          <ThemedText style={styles.yourBidText}>Votre enchère</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={[
                      styles.bidderAmount,
                      index === 0 && styles.highestBidAmount
                    ]}>
                      {formatPrice(bidder.amount)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.expirationContainer, isExpired && styles.expiredContainer]}>
              <Ionicons 
                name={isExpired ? "close-circle" : "calendar"} 
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
                {currentAuction.description || 'Aucune description'}
              </ThemedText>
            </View>

            <View style={styles.sellerSection}>
              <ThemedText style={styles.sectionTitle}>Vendeur</ThemedText>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  {sellerPhotoUrl && !sellerPhotoRefreshing ? (
                    <Image 
                      source={{ uri: sellerPhotoUrl }} 
                      style={styles.sellerAvatarImage}
                      onError={() => setSellerPhotoUrl(null)}
                    />
                  ) : (
                    <LinearGradient
                      colors={[Colors.primary, '#764ba2']}
                      style={styles.sellerAvatarGradient}
                    >
                      {sellerPhotoRefreshing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText style={styles.sellerInitial}>
                          {getSellerInitial()}
                        </ThemedText>
                      )}
                    </LinearGradient>
                  )}
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
          </ThemedCard>

          {/* Bid Button */}
          {!isExpired && currentAuction.sellerId !== user?.id && (
            <TouchableOpacity
              style={[styles.bidButton, placingBid && styles.disabledButton]}
              onPress={handlePlaceBid}
              disabled={placingBid}
            >
              <LinearGradient
                colors={[Colors.primary, '#764ba2']}
                style={styles.bidButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {placingBid ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#fff" />
                    <ThemedText style={styles.bidButtonText}>
                      Placement en cours...
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="hammer" size={24} color="#fff" />
                    <ThemedText style={styles.bidButtonText}>
                      Placer une enchère
                    </ThemedText>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bid Modal */}
      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText title style={styles.modalTitle}>
                Placer une enchère
              </ThemedText>
              <TouchableOpacity onPress={() => setShowBidModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalLabel}>
                Enchère actuelle la plus élevée
              </ThemedText>
              <ThemedText title style={styles.modalCurrentBid}>
                {formatPrice(highestBid)}
              </ThemedText>

              <ThemedText style={styles.modalLabel}>
                Montant minimum
              </ThemedText>
              <ThemedText style={styles.modalMinBid}>
                {formatPrice(highestBid + 1)}
              </ThemedText>

              <View style={styles.bidInputContainer}>
                <ThemedText style={styles.currencySymbol}>TND</ThemedText>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  placeholder="Entrez votre enchère"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowBidModal(false)}
                >
                  <ThemedText style={styles.cancelModalButtonText}>
                    Annuler
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  onPress={submitBid}
                  disabled={placingBid}
                >
                  {placingBid ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.confirmModalButtonText}>
                      Confirmer
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
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
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  lastHourBadge: {
    backgroundColor: '#ef4444',
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  countdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  highestBidSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  highestBidLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  highestBidContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  highestBid: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bestBidderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  bestBidderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  wonBadge: {
    backgroundColor: '#4ade80',
  },
  lostBadge: {
    backgroundColor: '#ef4444',
  },
  resultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  biddersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bidderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bidderRank: {
    width: 30,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    color: '#666',
  },
  bidderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bidderName: {
    fontSize: 14,
  },
  currentUserText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  yourBidBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  yourBidText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  bidderAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  highestBidAmount: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  expiredContainer: {
    backgroundColor: '#fee2e2',
  },
  expirationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  expiredText: {
    color: '#ef4444',
    fontWeight: '600',
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
    marginRight: 15,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  bidButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bidButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 15,
  },
  modalLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalCurrentBid: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  modalMinBid: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 15,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  currencySymbol: {
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
  },
  bidInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmModalButton: {
    backgroundColor: Colors.primary,
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});