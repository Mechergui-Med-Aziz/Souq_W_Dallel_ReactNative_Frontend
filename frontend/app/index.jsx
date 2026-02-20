import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  TextInput,
  FlatList,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedCard from '../components/ThemedCard';
import Spacer from '../components/Spacer';
import AuctionCard from '../components/AuctionCard';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchAllAuctions } from '../store/slices/auctionSlice';
import { Colors } from '../constants/Colors';

const categories = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'vehicles', label: 'Vehicles', icon: 'car-outline' },
  { id: 'real-estate', label: 'Real Estate', icon: 'home-outline' },
  { id: 'collectibles', label: 'Collectibles', icon: 'albums-outline' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline' },
  { id: 'jewelry', label: 'Jewelry', icon: 'diamond-outline' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt-outline' },
  { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
  { id: 'general', label: 'General', icon: 'apps-outline' },
];

const Home = () => {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { auctions, loading } = useAppSelector((state) => state.auction);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      await dispatch(fetchAllAuctions()).unwrap();
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAuctions();
    setRefreshing(false);
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = searchQuery === '' || 
      auction.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      auction.category === selectedCategory;
    
    // Check if auction is expired
    const now = new Date();
    const isExpired = auction.expireDate && new Date(auction.expireDate) <= now;
    
    // Only show active (not expired) auctions on home page
    const isActive = !isExpired && auction.status?.toLowerCase() === 'active';
    
    return matchesSearch && matchesCategory && isActive;
  });

  const getUserPhotoUrl = () => {
    if (user?.id) {
      return `http://10.13.248.28:8080/api/users/${user.id}/photo`;
    }
    return null;
  };

  const displayName = user?.firstname && user?.lastname 
    ? `${user.firstname} ${user.lastname}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <ThemedView safe style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="hammer" size={32} color={Colors.primary} />
          <ThemedText title style={styles.appName}>
            Souq w Dallel
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={() => router.push('/(dashboard)/profile')}
        >
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName} numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText style={styles.profileRole} numberOfLines={1}>
              {user?.role || 'User'}
            </ThemedText>
          </View>
          
          <View style={styles.photoContainer}>
            {getUserPhotoUrl() ? (
              <Image 
                source={{ uri: getUserPhotoUrl() }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.defaultPhoto}>
                <ThemedText style={styles.defaultPhotoText}>
                  {displayName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search auctions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filters - All categories with icons */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={18} 
                color={selectedCategory === category.id ? '#fff' : '#666'} 
              />
              <ThemedText style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Auctions List */}
      <FlatList
        data={filteredAuctions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AuctionCard 
            auction={item}
            onPress={() => router.push(`/auction-details/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.auctionsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="hammer" size={60} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              No auctions found
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {loading ? 'Loading auctions...' : 'Be the first to create one!'}
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: Colors.primary,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'flex-end',
    marginRight: 10,
    maxWidth: 120,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileRole: {
    fontSize: 12,
    opacity: 0.7,
  },
  photoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  defaultPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPhotoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoriesWrapper: {
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  auctionsList: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});