import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedButton from '../../components/ThemedButton';
import ThemedCard from '../../components/ThemedCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAuctionById } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';
import { auctionService } from '../../store/services/auctionService';

const { width: screenWidth } = Dimensions.get('window');

const AuctionDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { currentAuction, loading } = useAppSelector((state) => state.auction);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [auctionPhotos, setAuctionPhotos] = useState([]);

  useEffect(() => {
    if (id) {
      loadAuction();
    }
  }, [id]);

  useEffect(() => {
    if (currentAuction && user) {
      setIsOwner(currentAuction.seller?.id === user.id);
      
      // Load auction photos
      if (currentAuction.photoId?.length > 0) {
        const photos = currentAuction.photoId.map(photoId => 
          auctionService.getAuctionPhotoUrl(currentAuction.id, photoId)
        );
        setAuctionPhotos(photos);
      }
    }
  }, [currentAuction, user]);

  const loadAuction = async () => {
    try {
      await dispatch(fetchAuctionById(id)).unwrap();
    } catch (error) {
      console.error('Error loading auction:', error);
      Alert.alert('Error', 'Failed to load auction details');
    }
  };

  const handlePlaceBid = () => {
    if (!currentBid || parseFloat(currentBid) <= (currentAuction?.startingPrice || 0)) {
      Alert.alert('Invalid Bid', 'Bid must be higher than current price');
      return;
    }
    
    Alert.alert(
      'Place Bid',
      `Are you sure you want to place a bid of $${currentBid}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Place Bid', 
          onPress: () => {
            Alert.alert('Success', 'Your bid has been placed!');
            setCurrentBid('');
          }
        }
      ]
    );
  };

  const handleEditAuction = () => {
    router.push(`/edit-auction/${id}`);
  };

  const handleDeleteAuction = () => {
    Alert.alert(
      'Delete Auction',
      'Are you sure you want to delete this auction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Auction deleted successfully!');
            router.back();
          }
        }
      ]
    );
  };

  const formatPrice = (price) => {
    return `$${price?.toFixed(2) || '0.00'}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4ade80';
      case 'pending': return '#fbbf24';
      case 'ended': return '#ef4444';
      default: return '#666';
    }
  };

  if (loading || !currentAuction) {
    return (
      <ThemedView safe style={styles.loadingContainer}>
        <ThemedText>Loading auction details...</ThemedText>
      </ThemedView>
    );
  }

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
              Auction Details
            </ThemedText>
            <View style={styles.headerRight}>
              {isOwner && (
                <TouchableOpacity onPress={handleEditAuction} style={styles.headerIcon}>
                  <Ionicons name="create-outline" size={22} color={theme.iconColorFocused} />
                </TouchableOpacity>
              )}
            </View>
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
            <ThemedText style={styles.noImageText}>No images available</ThemedText>
          </View>
        )}

        <View style={styles.content}>
          <ThemedCard style={styles.infoCard}>
            <View style={styles.titleRow}>
              <ThemedText title style={styles.auctionTitle}>
                {currentAuction.title}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentAuction.status) }]}>
                <ThemedText style={styles.statusText}>
                  {currentAuction.status || 'Active'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceSection}>
              <View>
                <ThemedText style={styles.priceLabel}>Starting Price</ThemedText>
                <ThemedText title style={styles.price}>
                  {formatPrice(currentAuction.startingPrice)}
                </ThemedText>
              </View>
              
              <View style={styles.timeSection}>
                <Ionicons name="time" size={20} color={Colors.primary} />
                <ThemedText style={styles.timeText}>
                  {currentAuction.timeLeft || '24h left'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <ThemedText style={styles.sectionTitle}>Description</ThemedText>
              <ThemedText style={styles.description}>
                {currentAuction.description || 'No description available.'}
              </ThemedText>
            </View>

            <View style={styles.sellerSection}>
              <ThemedText style={styles.sectionTitle}>Seller Information</ThemedText>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <ThemedText style={styles.sellerInitial}>
                    {currentAuction.seller?.firstname?.charAt(0)?.toUpperCase() || 'S'}
                  </ThemedText>
                </View>
                <View style={styles.sellerDetails}>
                  <ThemedText style={styles.sellerName}>
                    {currentAuction.seller?.firstname || 'Unknown'} {currentAuction.seller?.lastname || ''}
                  </ThemedText>
                  <ThemedText style={styles.sellerEmail}>
                    {currentAuction.seller?.email || 'No email'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedCard>

          {isOwner && (
            <ThemedCard style={styles.ownerActionsCard}>
              <ThemedText style={styles.sectionTitle}>Auction Management</ThemedText>
              <View style={styles.ownerButtons}>
                <ThemedButton
                  onPress={handleEditAuction}
                  style={styles.ownerButton}
                  variant="secondary"
                >
                  <Ionicons name="create" size={20} color={Colors.primary} />
                  <ThemedText style={styles.ownerButtonText}>Edit Auction</ThemedText>
                </ThemedButton>
                
                <ThemedButton
                  onPress={handleDeleteAuction}
                  style={[styles.ownerButton, styles.deleteButton]}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <ThemedText style={[styles.ownerButtonText, styles.deleteButtonText]}>
                    Delete Auction
                  </ThemedText>
                </ThemedButton>
              </View>
            </ThemedCard>
          )}

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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 5,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  auctionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 25,
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
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
    marginBottom: 25,
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    color: Colors.primary,
  },
  bidCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bidIcon: {
    marginRight: 10,
  },
  bidInput: {
    flex: 1,
    marginRight: 10,
  },
  bidButton: {
    paddingHorizontal: 20,
  },
  bidButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bidHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  ownerActionsCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
  },
  ownerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  ownerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  ownerButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.warning,
  },
  deleteButtonText: {
    color: '#fff',
  },
});