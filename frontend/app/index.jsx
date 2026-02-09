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
import AuctionCard from '../components/AuctionCard';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchAllAuctions } from '../store/slices/auctionSlice';
import { Colors } from '../constants/Colors';

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
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'collectibles', label: 'Collectibles' },
  ];

  const displayName = user?.firstname && user?.lastname 
    ? `${user.firstname} ${user.lastname}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <ThemedView safe style={styles.container}>
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
            <View style={styles.defaultPhoto}>
              <ThemedText style={styles.defaultPhotoText}>
                {displayName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </View>

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
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
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

      <View style={styles.actionsBar}>
        <ThemedText title style={styles.sectionTitle}>
          Live Auctions
        </ThemedText>
      </View>

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
    paddingTop: 15,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    marginBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
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
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  auctionsList: {
    padding: 20,
    paddingTop: 10,
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