import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { 
  fetchParcelById, 
  updateParcelQuality 
} from '../../store/slices/parcelSlice';
import { Colors } from '../../constants/Colors';

const ParcelDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { currentParcel, loading } = useAppSelector((state) => state.parcel);
  
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadParcel();
    }
  }, [id]);

  const loadParcel = async () => {
    try {
      await dispatch(fetchParcelById(id)).unwrap();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails du colis');
      router.back();
    }
  };

  const handleQualityCheck = (quality) => {
    setIsValid(quality);
    if (quality) {
      submitQualityCheck(true);
    } else {
      setShowQualityModal(true);
    }
  };

  const submitQualityCheck = async (good = null) => {
    const isValidValue = good !== null ? good : isValid;
    
    if (isValidValue === false && !description.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire le problème de qualité');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(updateParcelQuality({
        id,
        isValid: isValidValue,
        description: isValidValue ? '' : description.trim()
      })).unwrap();
      
      Alert.alert('Succès', 'Votre évaluation a été enregistrée');
      setShowQualityModal(false);
      setDescription('');
      await loadParcel();
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentParcel) {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>
          Chargement...
        </ThemedText>
      </ThemedView>
    );
  }

  const isBuyer = currentParcel.buyerId === user?.id;
  const canRateQuality = currentParcel.delivred && currentParcel.isValid === null;

  return (
    <ThemedView safe style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.iconColorFocused} 
            />
          </TouchableOpacity>
          <ThemedText title style={styles.headerTitle}>
            Détails du colis
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <ThemedCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="cube" size={32} color={Colors.primary} />
            <View style={[
              styles.statusBadge,
              { backgroundColor: 
                currentParcel.delivred ? '#4ade80' : 
                currentParcel.transporterId ? '#fbbf24' : '#9ca3af'
              }
            ]}>
              <ThemedText style={styles.statusBadgeText}>
                {currentParcel.delivred ? 'Livré' : 
                 currentParcel.transporterId ? 'En cours de livraison' : 
                 'En attente'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.parcelId}>
            Colis #{currentParcel.id.substring(0, 8)}
          </ThemedText>
        </ThemedCard>

        {/* Delivery Details */}
        <ThemedCard style={styles.detailsCard}>
          <ThemedText style={styles.sectionTitle}>
            Informations de livraison
          </ThemedText>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>
                Point de collecte
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {currentParcel.pickUpAdress || 'À définir'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>
                Destination
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {currentParcel.destinationAdress || 'À définir'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="car" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>
                Transporteur
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {currentParcel.transporterId ? 
                  `ID: ${currentParcel.transporterId.substring(0, 8)}...` : 
                  'En attente d\'assignation'}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Quality Check Section - For Buyer Only */}
        {isBuyer && currentParcel.delivred && (
          <ThemedCard style={styles.qualityCard}>
            <ThemedText style={styles.sectionTitle}>
              Évaluation du produit
            </ThemedText>
            
            {currentParcel.isValid !== null ? (
              <View style={styles.qualityResult}>
                <Ionicons 
                  name={currentParcel.isValid ? 
                    "checkmark-circle" : "alert-circle"} 
                  size={48} 
                  color={currentParcel.isValid ? "#4ade80" : "#ef4444"} 
                />
                <ThemedText style={styles.qualityResultText}>
                  {currentParcel.isValid ? 
                    'Produit conforme - Merci pour votre retour !' : 
                    'Produit non conforme'}
                </ThemedText>
                {!currentParcel.isValid && currentParcel.unvalidDescription && (
                  <ThemedText style={styles.qualityDescription}>
                    Motif: {currentParcel.unvalidDescription}
                  </ThemedText>
                )}
              </View>
            ) : (
              <View style={styles.qualityButtons}>
                <TouchableOpacity
                  style={[styles.qualityButton, styles.goodButton]}
                  onPress={() => handleQualityCheck(true)}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <ThemedText style={styles.qualityButtonText}>
                    Produit conforme
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.qualityButton, styles.badButton]}
                  onPress={() => handleQualityCheck(false)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                  <ThemedText style={styles.qualityButtonText}>
                    Produit non conforme
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedCard>
        )}
      </ScrollView>

      {/* Quality Check Modal for Non-Conforming Products */}
      <Modal
        visible={showQualityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Produit non conforme
              </ThemedText>
              <TouchableOpacity onPress={() => setShowQualityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalLabel}>
                Veuillez décrire le problème:
              </ThemedText>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Décrivez le problème rencontré..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowQualityModal(false)}
                >
                  <ThemedText style={styles.cancelModalButtonText}>
                    Annuler
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  onPress={() => submitQualityCheck(false)}
                  disabled={submitting}
                >
                  {submitting ? (
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

export default ParcelDetails;

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
    height: 100, 
    justifyContent: 'flex-end', 
    paddingBottom: 15, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20 
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  backButton: { 
    padding: 5 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerRight: { 
    width: 40 
  },
  content: { 
    flex: 1, 
    padding: 20 
  },
  statusCard: { 
    marginBottom: 20, 
    padding: 20, 
    alignItems: 'center' 
  },
  statusHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 15 
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  statusBadgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  parcelId: { 
    fontSize: 14, 
    fontFamily: 'monospace', 
    opacity: 0.7 
  },
  detailsCard: { 
    marginBottom: 20, 
    padding: 20 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 15 
  },
  detailRow: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    gap: 12 
  },
  detailContent: { 
    flex: 1 
  },
  detailLabel: { 
    fontSize: 12, 
    opacity: 0.6, 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 14, 
    fontWeight: '500' 
  },
  qualityCard: { 
    padding: 20 
  },
  qualityButtons: { 
    flexDirection: 'row', 
    gap: 12 
  },
  qualityButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 8 
  },
  goodButton: { 
    backgroundColor: '#4ade80' 
  },
  badButton: { 
    backgroundColor: '#ef4444' 
  },
  qualityButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  qualityResult: { 
    alignItems: 'center', 
    gap: 12 
  },
  qualityResultText: { 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  qualityDescription: { 
    fontSize: 14, 
    opacity: 0.7, 
    textAlign: 'center', 
    marginTop: 8 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 25, 
    width: '90%', 
    maxWidth: 400 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  modalBody: { 
    gap: 15 
  },
  modalLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 5 
  },
  descriptionInput: { 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 14, 
    minHeight: 100, 
    textAlignVertical: 'top' 
  },
  modalActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 10 
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  cancelModalButton: { 
    backgroundColor: '#f0f0f0' 
  },
  cancelModalButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#666' 
  },
  confirmModalButton: { 
    backgroundColor: Colors.primary 
  },
  confirmModalButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff' 
  }
});