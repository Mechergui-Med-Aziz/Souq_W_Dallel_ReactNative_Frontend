import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchParcelsByBuyer } from '../../store/slices/parcelSlice';
import { Colors } from '../../constants/Colors';

const MyParcels = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { buyerParcels, loading } = useAppSelector((state) => state.parcel);
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadParcels();
    }
  }, [user?.id]);

  useEffect(() => {
    calculateStats();
  }, [buyerParcels]);

  const loadParcels = async () => {
    try {
      await dispatch(fetchParcelsByBuyer(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading parcels:', error);
    }
  };

  const calculateStats = () => {
    const delivered = buyerParcels.filter(p => p.delivred).length;
    const pending = buyerParcels.filter(p => !p.delivred).length;
    setStats({
      total: buyerParcels.length,
      pending,
      delivered
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParcels();
    setRefreshing(false);
  };

  const handleParcelPress = (parcelId) => {
    router.push(`/parcel-details/${parcelId}`);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
          </TouchableOpacity>
          <ThemedText title style={styles.headerTitle}>
            Mes colis
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ThemedCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="cube" size={24} color={Colors.primary} />
          </View>
          <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
          <ThemedText style={styles.statLabel}>Total colis</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fbbf24' + '20' }]}>
            <Ionicons name="time" size={24} color="#fbbf24" />
          </View>
          <ThemedText style={styles.statValue}>{stats.pending}</ThemedText>
          <ThemedText style={styles.statLabel}>En attente</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#4ade80' + '20' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
          </View>
          <ThemedText style={styles.statValue}>{stats.delivered}</ThemedText>
          <ThemedText style={styles.statLabel}>Livrés</ThemedText>
        </ThemedCard>
      </View>

      {/* Parcels List */}
      <ScrollView
        style={styles.parcelsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {buyerParcels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              Aucun colis
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Vous n'avez pas encore de colis
            </ThemedText>
          </View>
        ) : (
          buyerParcels.map(parcel => (
            <TouchableOpacity key={parcel.id} onPress={() => handleParcelPress(parcel.id)}>
              <ThemedCard style={styles.parcelCard}>
                <View style={styles.parcelHeader}>
                  <View style={styles.parcelId}>
                    <Ionicons name="cube" size={20} color={Colors.primary} />
                    <ThemedText style={styles.parcelIdText}>
                      Colis #{parcel.id.substring(0, 8)}
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.parcelStatus,
                    { backgroundColor: parcel.delivred ? '#4ade80' : '#fbbf24' }
                  ]}>
                    <ThemedText style={styles.parcelStatusText}>
                      {parcel.delivred ? 'Livré' : 'En cours'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.parcelDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="hammer" size={16} color="#666" />
                    <ThemedText style={styles.detailText}>
                      Enchère #{parcel.auctionId?.substring(0, 8)}...
                    </ThemedText>
                  </View>

                  {parcel.transporterId && (
                    <View style={styles.detailRow}>
                      <Ionicons name="car" size={16} color="#666" />
                      <ThemedText style={styles.detailText}>
                        Transporteur: {parcel.transporterId.substring(0, 8)}...
                      </ThemedText>
                    </View>
                  )}

                  {/* Show quality status if delivered */}
                  {parcel.delivred && parcel.isValid !== null && (
                    <View style={styles.qualityStatus}>
                      <Ionicons 
                        name={parcel.isValid ? "checkmark-circle" : "alert-circle"} 
                        size={16} 
                        color={parcel.isValid ? "#4ade80" : "#ef4444"} 
                      />
                      <ThemedText style={[
                        styles.qualityStatusText,
                        { color: parcel.isValid ? "#4ade80" : "#ef4444" }
                      ]}>
                        {parcel.isValid ? 'Produit conforme' : 'Produit non conforme'}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </ThemedCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default MyParcels;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
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
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  parcelsList: {
    flex: 1,
    padding: 15,
  },
  parcelCard: {
    marginBottom: 15,
    padding: 15,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  parcelId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parcelIdText: {
    fontSize: 14,
    fontWeight: '600',
  },
  parcelStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  parcelStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  parcelDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  qualityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  qualityStatusText: {
    fontSize: 12,
    fontWeight: '500',
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