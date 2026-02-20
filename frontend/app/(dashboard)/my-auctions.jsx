import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList,
  RefreshControl,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import AuctionCard from '../../components/AuctionCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserAuctions, deleteAuction } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'art', label: 'Art' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'sports', label: 'Sports' },
  { id: 'general', label: 'General' },
];

const MyAuctions = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { userAuctions, loading, deleting } = useAppSelector((state) => state.auction);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (user?.id) {
      loadUserAuctions();
    }
  }, [user?.id]);

  const loadUserAuctions = async () => {
    try {
      await dispatch(fetchUserAuctions(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading user auctions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserAuctions();
    setRefreshing(false);
  };

  const filteredAuctions = userAuctions.filter(auction => {
    // Status filter
    if (filter === 'active' && auction.status?.toLowerCase() !== 'active') return false;
    if (filter === 'ended' && auction.status?.toLowerCase() !== 'ended') return false;
    if (filter === 'pending' && auction.status?.toLowerCase() !== 'pending') return false;
        
    return true;
  });

  const openMenu = (auction, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX - 150, y: pageY + 10 });
    setSelectedAuction(auction);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (selectedAuction) {
      router.push(`/edit-auction/${selectedAuction.id}`);
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    if (!selectedAuction) return;
    
    Alert.alert(
      'Delete Auction',
      'Are you sure you want to delete this auction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAuction(selectedAuction.id)).unwrap();
              Alert.alert('Success', 'Auction deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete auction. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStats = () => {
    const total = userAuctions.length;
    const active = userAuctions.filter(a => a.status?.toLowerCase() === 'active').length;
    const ended = userAuctions.filter(a => a.status?.toLowerCase() === 'ended').length;
    const pending = userAuctions.filter(a => a.status?.toLowerCase() === 'pending').length;
    
    return { total, active, ended, pending };
  };

  const stats = getStats();

  const renderAuctionItem = ({ item }) => (
    <View style={styles.auctionItem}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={(event) => openMenu(item, event)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={theme.iconColor} />
      </TouchableOpacity>
      <AuctionCard 
        auction={item}
        onPress={() => router.push(`/auction-details/${item.id}`)}
      />
    </View>
  );

  return (
    <ThemedView safe style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
          </TouchableOpacity>
          <ThemedText title style={styles.headerTitle}>
            My Auctions
          </ThemedText>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create-auction')}
          >
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ThemedCard style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText title style={styles.statNumber}>
                {stats.total}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#4ade80' }]}>
                {stats.active}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Active</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#fbbf24' }]}>
                {stats.pending}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#ef4444' }]}>
                {stats.ended}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Ended</ThemedText>
            </View>
          </View>
        </ThemedCard>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'pending', 'ended'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <ThemedText style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Auctions List */}
      <FlatList
        data={filteredAuctions}
        keyExtractor={(item) => item.id}
        renderItem={renderAuctionItem}
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
              {loading ? 'Loading your auctions...' : 'Create your first auction!'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => router.push('/create-auction')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <ThemedText style={styles.createFirstButtonText}>
                Create Auction
              </ThemedText>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Three Dots Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <ThemedText style={styles.menuItemText}>Edit Auction</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={[styles.menuItem, styles.deleteMenuItem]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={Colors.warning} />
              <ThemedText style={[styles.menuItemText, styles.deleteMenuItemText]}>
                Delete Auction
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
};

export default MyAuctions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  createButton: {
    padding: 5,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsCard: {
    borderRadius: 15,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  auctionsList: {
    padding: 20,
    paddingTop: 0,
  },
  auctionItem: {
    marginBottom: 20,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 20,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  deleteMenuItem: {
    // No specific style needed
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  deleteMenuItemText: {
    color: Colors.warning,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
});