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
import { 
  fetchParcelsByTransporter, 
  deliverParcel 
} from '../../store/slices/parcelSlice';
import { Colors } from '../../constants/Colors';

const TransporterHome = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { transporterParcels, loading } = useAppSelector((state) => state.parcel);
  
  const [refreshing, setRefreshing] = useState(false);
  const [processingParcelId, setProcessingParcelId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    delivered: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadParcels();
    }
  }, [user?.id]);

  useEffect(() => {
    calculateStats();
  }, [transporterParcels]);

  const loadParcels = async () => {
    try {
      await dispatch(fetchParcelsByTransporter(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading parcels:', error);
    }
  };

  const calculateStats = () => {
    const delivered = transporterParcels.filter(p => p.delivred).length;
    const inProgress = transporterParcels.filter(p => !p.delivred).length;
    setStats({
      total: transporterParcels.length,
      inProgress,
      delivered
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParcels();
    setRefreshing(false);
  };

  const handleDeliverParcel = async (parcelId) => {
    Alert.alert(
      'Livraison',
      'Confirmez-vous que ce colis a été livré ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setProcessingParcelId(parcelId);
              await dispatch(deliverParcel(parcelId)).unwrap();
              Alert.alert('Succès', 'Colis marqué comme livré');
              await loadParcels();
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la mise à jour');
            } finally {
              setProcessingParcelId(null);
            }
          }
        }
      ]
    );
  };

  const handleParcelPress = (parcelId) => {
    router.push(`/parcel-details/${parcelId}`);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>
          Chargement...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>
            Mes livraisons
          </ThemedText>
          <TouchableOpacity 
            onPress={() => router.push('/(dashboard)/profile')}
            style={styles.profileButton}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <ThemedCard style={styles.statCard}>
          <View style={[
            styles.statIcon, 
            { backgroundColor: Colors.primary + '20' }
          ]}>
            <Ionicons name="cube" size={24} color={Colors.primary} />
          </View>
          <ThemedText style={styles.statValue}>
            {stats.total}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Total colis
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.statCard}>
          <View style={[
            styles.statIcon, 
            { backgroundColor: '#fbbf24' + '20' }
          ]}>
            <Ionicons name="time" size={24} color="#fbbf24" />
          </View>
          <ThemedText style={styles.statValue}>
            {stats.inProgress}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            En cours
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.statCard}>
          <View style={[
            styles.statIcon, 
            { backgroundColor: '#4ade80' + '20' }
          ]}>
            <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
          </View>
          <ThemedText style={styles.statValue}>
            {stats.delivered}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Livrés
          </ThemedText>
        </ThemedCard>
      </View>

      <ScrollView
        style={styles.parcelsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {transporterParcels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              Aucun colis assigné
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Vous n'avez pas encore de colis à livrer
            </ThemedText>
          </View>
        ) : (
          transporterParcels.map(parcel => (
            <TouchableOpacity 
              key={parcel.id} 
              onPress={() => handleParcelPress(parcel.id)}
            >
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
                    <Ionicons name="location" size={16} color="#666" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>
                        Point de collecte
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {parcel.pickUpAdress || 'À définir'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="navigate" size={16} color="#666" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>
                        Destination
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {parcel.destinationAdress || 'À définir'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>
                        Destinataire
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        ID: {parcel.buyerId?.substring(0, 8)}...
                      </ThemedText>
                    </View>
                  </View>

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
                        {parcel.isValid ? 
                          'Produit conforme' : 
                          'Produit non conforme'}
                      </ThemedText>
                    </View>
                  )}
                </View>

                {!parcel.delivred && (
                  <TouchableOpacity
                    style={styles.deliverButton}
                    onPress={() => handleDeliverParcel(parcel.id)}
                    disabled={processingParcelId === parcel.id}
                  >
                    <LinearGradient
                      colors={['#4ade80', '#22c55e']}
                      style={styles.deliverGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {processingParcelId === parcel.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color="#fff" 
                          />
                          <ThemedText style={styles.deliverButtonText}>
                            Confirmer livraison
                          </ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </ThemedCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default TransporterHome;

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: Colors.primary 
  },
  header: { 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 25, 
    borderBottomRightRadius: 25 
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  profileButton: { 
    padding: 5 
  },
  statsContainer: { 
    flexDirection: 'row', 
    padding: 15, 
    gap: 10 
  },
  statCard: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 15 
  },
  statIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    opacity: 0.7 
  },
  parcelsList: { 
    flex: 1, 
    padding: 15 
  },
  parcelCard: { 
    marginBottom: 15, 
    padding: 15 
  },
  parcelHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  parcelId: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  parcelIdText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  parcelStatus: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  parcelStatusText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  parcelDetails: { 
    gap: 12, 
    marginBottom: 15 
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10 
  },
  detailContent: { 
    flex: 1 
  },
  detailLabel: { 
    fontSize: 11, 
    opacity: 0.6, 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13 
  },
  qualityStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 4, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  qualityStatusText: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  deliverButton: { 
    borderRadius: 10, 
    overflow: 'hidden', 
    marginTop: 10 
  },
  deliverGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    gap: 8 
  },
  deliverButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60 
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 15, 
    marginBottom: 5 
  },
  emptySubtext: { 
    fontSize: 14, 
    opacity: 0.7, 
    textAlign: 'center' 
  }
});