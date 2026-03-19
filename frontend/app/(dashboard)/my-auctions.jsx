import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import AuctionCard from '../../components/AuctionCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAllAuctions } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';

const MyAuctions = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { auctions, loading } = useAppSelector((state) => state.auction);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('created');
  
  // Derived state
  const [createdAuctions, setCreatedAuctions] = useState([]);
  const [participatedAuctions, setParticipatedAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [lostAuctions, setLostAuctions] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [deniedAuctions, setDeniedAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadAllAuctions();
    }
  }, [user?.id]);

  useEffect(() => {
    processAuctions();
  }, [auctions, user?.id]);

  useEffect(() => {
    filterAuctions();
  }, [selectedFilter, createdAuctions, participatedAuctions, wonAuctions, lostAuctions, activeAuctions, pendingAuctions, deniedAuctions, endedAuctions]);

  const loadAllAuctions = async () => {
    try {
      await dispatch(fetchAllAuctions()).unwrap();
      console.log('All auctions loaded:', auctions.length);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
  };

  const processAuctions = () => {
    if (!auctions.length || !user?.id) return;

    console.log('Processing auctions for user:', user.id);
    console.log('Total auctions:', auctions.length);
    
    const now = new Date();
    
    // Created auctions (where user is seller)
    const created = auctions.filter(auction => auction.sellerId === user.id);
    setCreatedAuctions(created);

    // Participated auctions (where user has bid)
    const participated = auctions.filter(auction => 
      auction.bidders && Object.keys(auction.bidders).includes(user.id)
    );
    setParticipatedAuctions(participated);

    // Won auctions - Check if user's bid is the highest AND auction is ended
    const won = participated.filter(auction => {
      const isEnded = auction.status === 'ended' || new Date(auction.expireDate) <= now;
      if (!isEnded) return false;
      
      const bids = Object.entries(auction.bidders || {});
      if (bids.length === 0) return false;
      
      const bidAmounts = bids.map(([, amount]) => amount);
      const highestBid = Math.max(...bidAmounts);
      
      const highestBidders = bids
        .filter(([, amount]) => amount === highestBid)
        .map(([id]) => id);
      
      return highestBidders.includes(user.id);
    });
    setWonAuctions(won);

    // Lost auctions - User participated but not highest bidder AND auction is ended
    const lost = participated.filter(auction => {
      const isEnded = auction.status === 'ended' || new Date(auction.expireDate) <= now;
      if (!isEnded) return false;
      
      const bids = Object.entries(auction.bidders || {});
      if (bids.length === 0) return false;
      
      const bidAmounts = bids.map(([, amount]) => amount);
      const highestBid = Math.max(...bidAmounts);
      
      const highestBidders = bids
        .filter(([, amount]) => amount === highestBid)
        .map(([id]) => id);
      
      return !highestBidders.includes(user.id);
    });
    setLostAuctions(lost);

    // Active auctions (approved and not expired)
    const active = created.filter(auction => 
      auction.status === 'active' && new Date(auction.expireDate) > now
    );
    setActiveAuctions(active);

    // NEW: Pending auctions (awaiting admin approval)
    const pending = created.filter(auction => 
      auction.status === 'pending'
    );
    setPendingAuctions(pending);

    // NEW: Denied auctions (rejected by admin)
    const denied = created.filter(auction => 
      auction.status === 'denied'
    );
    setDeniedAuctions(denied);

    // Ended auctions - User's created auctions that ended
    const ended = created.filter(auction => 
      auction.status === 'ended' || new Date(auction.expireDate) <= now
    );
    setEndedAuctions(ended);

    console.log('Created:', created.length);
    console.log('Participated:', participated.length);
    console.log('Won:', won.length);
    console.log('Lost:', lost.length);
    console.log('Active (user):', active.length);
    console.log('Pending (user):', pending.length);
    console.log('Denied (user):', denied.length);
    console.log('Ended (user):', ended.length);
  };

  const filterAuctions = () => {
    switch (selectedFilter) {
      case 'created':
        setFilteredAuctions(createdAuctions);
        break;
      case 'participated':
        setFilteredAuctions(participatedAuctions);
        break;
      case 'won':
        setFilteredAuctions(wonAuctions);
        break;
      case 'lost':
        setFilteredAuctions(lostAuctions);
        break;
      case 'active':
        setFilteredAuctions(activeAuctions);
        break;
      case 'pending': // NEW
        setFilteredAuctions(pendingAuctions);
        break;
      case 'denied': // NEW
        setFilteredAuctions(deniedAuctions);
        break;
      case 'ended':
        setFilteredAuctions(endedAuctions);
        break;
      default:
        setFilteredAuctions(createdAuctions);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllAuctions();
    setRefreshing(false);
  };

  const getStats = () => ({
    created: createdAuctions.length,
    participated: participatedAuctions.length,
    won: wonAuctions.length,
    lost: lostAuctions.length,
    active: activeAuctions.length,
    pending: pendingAuctions.length, // NEW
    denied: deniedAuctions.length, // NEW
    ended: endedAuctions.length
  });

  const stats = getStats();

  const handleAuctionPress = (auctionId) => {
    console.log('Auction pressed:', auctionId, 'Filter:', selectedFilter);
    
    // Navigate to edit page for created, active, pending, denied auctions (ones you can edit)
    if (selectedFilter === 'created' || selectedFilter === 'active' || selectedFilter === 'pending' || selectedFilter === 'denied') {
      router.push(`/edit-auction/${auctionId}`);
    } 
    // Navigate to details page for participated, won, lost, and ended auctions
    else {
      router.push(`/auction-details/${auctionId}`);
    }
  };

  const FilterChip = ({ id, label, count, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === id && styles.filterChipActive
      ]}
      onPress={() => setSelectedFilter(id)}
      activeOpacity={0.7}
    >
      <View style={styles.filterChipContent}>
        <Ionicons 
          name={icon} 
          size={16} 
          color={selectedFilter === id ? '#fff' : Colors.primary} 
        />
        <ThemedText style={[
          styles.filterChipLabel,
          selectedFilter === id && styles.filterChipLabelActive
        ]}>
          {label}
        </ThemedText>
      </View>
      <View style={[
        styles.filterChipBadge,
        selectedFilter === id && styles.filterChipBadgeActive
      ]}>
        <ThemedText style={[
          styles.filterChipBadgeText,
          selectedFilter === id && styles.filterChipBadgeTextActive
        ]}>
          {count}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderAuctionItem = ({ item }) => (
    <AuctionCard 
      auction={item} 
      onPress={() => handleAuctionPress(item.id)}
    />
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
            Mes Enchères
          </ThemedText>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create-auction')}
          >
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips - Added pending and denied */}
      <View style={styles.filtersWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <FilterChip id="created" label="Créées" count={stats.created} icon="create-outline" />
          <FilterChip id="active" label="Actives" count={stats.active} icon="play-circle-outline" />
          <FilterChip id="pending" label="En attente" count={stats.pending} icon="time-outline" />
          <FilterChip id="denied" label="Refusées" count={stats.denied} icon="close-circle-outline" />
          <FilterChip id="participated" label="Participées" count={stats.participated} icon="people-outline" />
          <FilterChip id="won" label="Gagnées" count={stats.won} icon="trophy-outline" />
          <FilterChip id="lost" label="Perdues" count={stats.lost} icon="close-circle-outline" />
          <FilterChip id="ended" label="Terminées" count={stats.ended} icon="stop-circle-outline" />
        </ScrollView>
      </View>

      {/* Info text about navigation */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
        <ThemedText style={styles.infoText}>
          {selectedFilter === 'created' || selectedFilter === 'active' || selectedFilter === 'pending' || selectedFilter === 'denied'
            ? 'Cliquez pour modifier vos enchères' 
            : 'Cliquez pour voir les détails des enchères'}
        </ThemedText>
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
              Aucune enchère trouvée
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {loading ? 'Chargement...' : 'Aucune enchère ne correspond à ce filtre'}
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  filtersWrapper: {
    marginTop: 15,
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersScroll: {
    maxHeight: 60,
  },
  filtersContainer: {
    paddingHorizontal: 15,
    gap: 12,
    paddingRight: 25,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 120,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterChipLabelActive: {
    color: '#fff',
  },
  filterChipBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipBadgeActive: {
    backgroundColor: '#fff',
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  filterChipBadgeTextActive: {
    color: Colors.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  auctionsList: {
    padding: 15,
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