import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import ThemedText from './ThemedText';
import ThemedCard from './ThemedCard';
import { Colors } from '../constants/Colors';
import { useAuth } from '../hooks/useAuth';
import { paymentService } from '../store/services/paymentService';

const AuctionPaymentModal = ({ visible, onClose, onPaymentComplete, auctionId, amount }) => {
  const { confirmPayment } = useStripe();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('24:00:00');

  // Calculate time left (24h from now)
  React.useEffect(() => {
    if (!visible) return;
    
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
        Alert.alert('Délai expiré', 'Le délai de paiement est expiré. L\'enchère sera attribuée au prochain enchérisseur.');
        onClose();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [visible]);

  const initializePayment = async () => {
    try {
      setInitializing(true);
      console.log('Creating auction payment intent...');
      const response = await paymentService.payAuction(auctionId, amount);
      console.log('Payment intent created:', response.clientSecret);
      
      if (response && response.clientSecret) {
        setClientSecret(response.clientSecret);
      } else {
        Alert.alert('Erreur', 'Réponse de paiement invalide');
        onClose();
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'initialiser le paiement');
      onClose();
    } finally {
      setInitializing(false);
    }
  };

  React.useEffect(() => {
    if (visible && auctionId && amount) {
      initializePayment();
    } else {
      setClientSecret(null);
      setCardDetails(null);
    }
  }, [visible, auctionId, amount]);

  const handlePayPress = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
      return;
    }

    if (!clientSecret) {
      Alert.alert('Erreur', 'Paiement non initialisé');
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: user?.firstname && user?.lastname 
              ? `${user.firstname} ${user.lastname}`
              : user?.email?.split('@')[0] || 'Client',
            email: user?.email,
          },
        },
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert('Erreur', error.message || 'Échec du paiement');
      } else if (paymentIntent) {
        console.log('Payment successful:', paymentIntent);
        await paymentService.markAsPaidForAuction(user.id, auctionId);
        Alert.alert('Succès', 'Paiement effectué avec succès !');
        onPaymentComplete();
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Erreur', error.message || 'Échec du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedCard style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Paiement de l'enchère
            </ThemedText>
            <TouchableOpacity onPress={onClose} disabled={loading || initializing}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.timeContainer}>
              <Ionicons name="time" size={24} color={Colors.warning} />
              <ThemedText style={styles.timeText}>
                Temps restant: {timeLeft}
              </ThemedText>
            </View>

            <View style={styles.amountContainer}>
              <ThemedText style={styles.amountLabel}>Montant à payer:</ThemedText>
              <ThemedText style={styles.amountValue}>{amount} TND</ThemedText>
            </View>

            {initializing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <ThemedText style={styles.loadingText}>
                  Initialisation du paiement...
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.cardContainer}>
                  <ThemedText style={styles.cardLabel}>
                    Informations de carte
                  </ThemedText>
                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{
                      number: '4242 4242 4242 4242',
                    }}
                    cardStyle={{
                      backgroundColor: '#FFFFFF',
                      textColor: '#000000',
                      borderRadius: 8,
                      fontSize: 14,
                      placeholderColor: '#999999',
                    }}
                    style={styles.cardField}
                    onCardChange={(cardDetails) => {
                      setCardDetails(cardDetails);
                    }}
                  />
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.cardInfoRow}>
                    <Ionicons name="lock-closed" size={16} color={Colors.primary} />
                    <ThemedText style={styles.cardInfoText}>
                      Paiement sécurisé par Stripe
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.cardInfoSubtext}>
                    Vos informations de carte sont cryptées
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[styles.payButton, (loading || !cardDetails?.complete) && styles.disabledButton]}
                  onPress={handlePayPress}
                  disabled={loading || !cardDetails?.complete}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color="#fff" />
                      <ThemedText style={styles.payButtonText}>
                        Payer {amount} TND
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ThemedCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    gap: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    gap: 10,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
  },
  amountContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
    gap: 15,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary,
  },
  cardContainer: {
    marginVertical: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardField: {
    width: '100%',
    height: 100,
  },
  cardInfo: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardInfoText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  cardInfoSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AuctionPaymentModal;