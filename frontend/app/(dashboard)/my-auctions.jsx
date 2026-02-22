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
import ThemedCard from '../../components/ThemedCard';
import AuctionCard from '../../components/AuctionCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserAuctions } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';

const MyAuctions = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { userAuctions, loading } = useAppSelector((state) => state.auction);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [participatedAuctions, setParticipatedAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [lostAuctions, setLostAuctions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadUserAuctions();
    }
  }, [user?.id]);

  useEffect(() => {
    // Calculate participated auctions (where user has bid)
    const participated = userAuctions.filter(auction => 
      auction.bidders && Object.keys(auction.bidders).includes(user?.id)
    );
    setParticipatedAuctions(participated);

    // Calculate won auctions (where user is highest bidder and auction ended)
    const won = participated.filter(auction => {
      if (!auction.bidders || auction.status !== 'ended') return false;
      const bids = Object.entries(auction.bidders);
      if (bids.length === 0) return false;
      const highestBidder = bids.sort((a, b) => b[1] - a[1])[0][0];
      return highestBidder === user?.id;
    });
    setWonAuctions(won);

    // Calculate lost auctions (where user participated but didn't win)
    const lost = participated.filter(auction => {
      if (!auction.bidders || auction.status !== 'ended') return false;
      const bids = Object.entries(auction.bidders);
      if (bids.length === 0) return false;
      const highestBidder = bids.sort((a, b) => b[1] - a[1])[0][0];
      return highestBidder !== user?.id;
    });
    setLostAuctions(lost);

  }, [userAuctions, user?.id]);

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

  const getFilteredAuctions = () => {
    switch (filter) {
      case 'created':
        return userAuctions.filter(auction => auction.sellerId === user?.id);
      case 'participated':
        return participatedAuctions;
      case 'won':
        return wonAuctions;
      case 'lost':
        return lostAuctions;
      case 'active':
        return userAuctions.filter(a => a.status?.toLowerCase() === 'active');
      case 'ended':
        return userAuctions.filter(a => a.status?.toLowerCase() === 'ended');
      default:
        return userAuctions;
    }
  };

  const getStats = () => {
    const created = userAuctions.filter(a => a.sellerId === user?.id).length;
    const participated = participatedAuctions.length;
    const won = wonAuctions.length;
    const lost = lostAuctions.length;
    
    return { created, participated, won, lost };
  };

  const stats = getStats();
  const filteredAuctions = getFilteredAuctions();

  const handleAuctionPress = (auctionId) => {
    router.push(`/edit-auction/${auctionId}`);
  };

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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ThemedCard style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText title style={styles.statNumber}>
                {stats.created}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Créées</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#3b82f6' }]}>
                {stats.participated}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Participées</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#fbbf24' }]}>
                {stats.won}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Gagnées</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#ef4444' }]}>
                {stats.lost}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Perdues</ThemedText>
            </View>
          </View>
        </ThemedCard>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'created', label: 'Mes créations' },
            { id: 'participated', label: 'Participées' },
            { id: 'won', label: 'Gagnées' },
            { id: 'lost', label: 'Perdues' },
            { id: 'active', label: 'Actives' },
            { id: 'ended', label: 'Terminées' }
          ].map((filterType) => (
            <TouchableOpacity
              key={filterType.id}
              style={[
                styles.filterButton,
                filter === filterType.id && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType.id)}
            >
              <ThemedText style={[
                styles.filterText,
                filter === filterType.id && styles.filterTextActive
              ]}>
                {filterType.label}
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
          <TouchableOpacity onPress={() => handleAuctionPress(item.id)}>
            <AuctionCard 
              auction={item}
              onPress={() => handleAuctionPress(item.id)}
            />
          </TouchableOpacity>
        )}
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
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
});