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
    if (filter === 'all') return true;
    if (filter === 'active' && auction.status?.toLowerCase() === 'active') return true;
    if (filter === 'ended' && auction.status?.toLowerCase() === 'ended') return true;
    if (filter === 'pending' && auction.status?.toLowerCase() === 'pending') return true;
    return false;
  });

  const getStats = () => {
    const total = userAuctions.length;
    const active = userAuctions.filter(a => a.status?.toLowerCase() === 'active').length;
    const ended = userAuctions.filter(a => a.status?.toLowerCase() === 'ended').length;
    const pending = userAuctions.filter(a => a.status?.toLowerCase() === 'pending').length;
    
    return { total, active, ended, pending };
  };

  const stats = getStats();

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
                {stats.total}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#4ade80' }]}>
                {stats.active}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Actives</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#fbbf24' }]}>
                {stats.pending}
              </ThemedText>
              <ThemedText style={styles.statLabel}>En attente</ThemedText>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <ThemedText title style={[styles.statNumber, { color: '#ef4444' }]}>
                {stats.ended}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Terminées</ThemedText>
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
                {filterType === 'all' ? 'Toutes' : 
                 filterType === 'active' ? 'Actives' :
                 filterType === 'pending' ? 'En attente' : 'Terminées'}
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
              {loading ? 'Chargement...' : 'Créez votre première enchère !'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => router.push('/create-auction')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <ThemedText style={styles.createFirstButtonText}>
                Créer une enchère
              </ThemedText>
            </TouchableOpacity>
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
});