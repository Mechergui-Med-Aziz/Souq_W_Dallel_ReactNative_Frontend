import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, ScrollView, Platform, Keyboard, View, Pressable, Modal } from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from '../../components/Spacer';
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../constants/ThemeContext";
import { showAlert } from '../../utils/alertHelper';

const REGLEMENT_TEXT = `Conditions Générales d'Utilisation (CGU)

Plateforme S&D Auction

1. Objet
Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'accès et d'utilisation de la plateforme S&D Auction, spécialisée dans les enchères en ligne.
Toute inscription implique l'acceptation pleine et entière des présentes conditions.

2. Inscription et Compte Utilisateur
• L'inscription est obligatoire pour participer aux enchères.
• L'utilisateur s'engage à fournir des informations exactes et à jour.
• Les identifiants sont strictement personnels et confidentiels.
• Toute activité effectuée via un compte est réputée être réalisée par son titulaire.

3. Utilisation de la Plateforme
L'utilisateur s'engage à :
• Respecter les lois en vigueur
• Ne pas publier de contenu inapproprié, offensant ou frauduleux
• Ne pas perturber le bon fonctionnement de la plateforme
Tout abus peut entraîner des sanctions.

4. Création et Validation des Enchères
• La création d'une enchère est soumise au paiement préalable de 5 % du prix de départ.
• Toute enchère créée est initialement placée en statut "en attente (pending)".
• Une validation par un administrateur est requise avant sa publication.
Cette procédure vise à :
• garantir la conformité des produits proposés
• éviter la publication de contenus ou descriptions inappropriés

5. Participation aux Enchères
• Lors de la première participation à une enchère, un montant de 1 dinar tunisien (1 DT) est requis.
• Une fois ce paiement effectué, l'utilisateur peut proposer plusieurs offres sur la même enchère sans frais supplémentaires.

6. Fonctionnement des Enchères
• L'enchère est attribuée au plus offrant à la clôture.
• Toute offre est ferme et engageante.
• La plateforme se réserve le droit d'annuler toute enchère en cas de fraude ou d'abus.

7. Paiement
• Le gagnant doit effectuer le paiement dans le délai imparti (ex : 24 heures).
• En cas de non-paiement :
  - l'enchère peut être annulée
  - le produit peut être attribué à un autre utilisateur
  - des sanctions peuvent être appliquées

8. Livraison
• La livraison est assurée sur l'ensemble du territoire tunisien.
• Les frais de livraison sont gratuits pour tous les utilisateurs.

9. Validation du Produit et Réclamations
• Après réception du produit, l'acheteur dispose d'un délai de 24 heures pour :
  - confirmer la conformité du produit
  - ou déposer une réclamation en cas de non-conformité
• Passé ce délai, le produit sera automatiquement considéré comme conforme, accepté et validé.

10. Suspension et Résiliation
La plateforme se réserve le droit de suspendre ou supprimer un compte en cas de :
• Non-respect des CGU
• Fraude ou tentative de fraude
• Comportement abusif envers les autres utilisateurs

11. Responsabilité
• La plateforme agit en tant qu'intermédiaire et ne peut être tenue responsable des litiges entre acheteurs et vendeurs.
• L'utilisateur est seul responsable de l'usage qu'il fait de la plateforme.

12. Modification des CGU
La plateforme se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification importante.

13. Contact
Pour toute question ou réclamation, veuillez contacter notre support à : souq.w.dallel@gmail.com`;

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    cin: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  
  const { register, loading, error } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const dismissKeyboard = () => {
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstname || !formData.lastname || !formData.cin || !formData.email || !formData.password) {
      showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (formData.cin.length !== 8) {
      showAlert('Erreur', 'Le CIN doit contenir 8 chiffres');
      return;
    }

    if (formData.password.length < 6) {
      showAlert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!acceptedTerms) {
      showAlert('Erreur', 'Vous devez accepter les conditions générales d\'utilisation pour vous inscrire.');
      return;
    }
    
    try {
      await AsyncStorage.multiRemove([
        'verificationCode', 
        'pendingVerificationEmail', 
        'pendingRegistrationPassword'
      ]);
      
      const result = await register(formData);
      
      if (result.payload && result.payload.code) {
        await AsyncStorage.setItem('verificationCode', result.payload.code);
        await AsyncStorage.setItem('pendingVerificationEmail', formData.email);
        await AsyncStorage.setItem('pendingRegistrationPassword', formData.password);
        
        showAlert(
          'Inscription réussie !',
          `Un code de vérification a été envoyé à ${formData.email}. Vous serez automatiquement connecté après vérification.`,
        );
        router.replace('/verify-account');
      }
      
    } catch (err) {
      showAlert('Échec de l\'inscription', err || 'Veuillez réessayer.');
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <Pressable onPress={dismissKeyboard} style={styles.pressable}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Spacer height={40} />
          
          <ThemedText title={true} style={styles.title}>
            Inscription
          </ThemedText>

          <ThemedTextInput
            style={styles.input}
            icon="person-outline"
            placeholder="Prénom"
            onChangeText={(value) => handleChange('firstname', value)}
            value={formData.firstname}
          />

          <ThemedTextInput
            style={styles.input}
            icon="person-outline"
            placeholder="Nom"
            onChangeText={(value) => handleChange('lastname', value)}
            value={formData.lastname}
          />

          <ThemedTextInput
            style={styles.input}
            icon="card-outline"
            placeholder="CIN (8 chiffres)"
            keyboardType="numeric"
            maxLength={8}
            onChangeText={(value) => handleChange('cin', value)}
            value={formData.cin}
          />

          <ThemedTextInput
            style={styles.input}
            icon="mail-outline"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(value) => handleChange('email', value)}
            value={formData.email}
          />

          <ThemedTextInput
            style={styles.input}
            icon="lock-closed-outline"
            placeholder="Mot de passe (min. 6 caractères)"
            autoCapitalize="none"
            onChangeText={(value) => handleChange('password', value)}
            value={formData.password}
            secureTextEntry
          />

          {/* Terms Checkbox */}
          <View style={styles.termsRow}>
            <TouchableOpacity
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
                { borderColor: acceptedTerms ? Colors.primary : theme.borderColor }
              ]}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <ThemedText style={styles.termsText}>
                J'accepte les{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowReglementModal(true)}>
                <Text style={styles.termsLink}>
                  conditions générales d'utilisation
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ThemedButton 
            onPress={handleSubmit} 
            disabled={loading || !acceptedTerms}
            style={[styles.button, (loading || !acceptedTerms) && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </Text>
          </ThemedButton>

          <Spacer />

          {error && <Text style={styles.error}> {error} </Text>}

          <Spacer height={30} />

          <TouchableOpacity onPress={() => router.push('/login')}>
            <ThemedText style={styles.linkRow}>
              Déjà un compte ?{' '}
              <Text style={styles.linkText}>Se connecter</Text>
            </ThemedText>
          </TouchableOpacity>

          <Spacer height={12} />

          <TouchableOpacity onPress={() => router.push('/reset-password')}>
            <Text style={styles.linkText}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <Spacer height={40} />
        </ScrollView>
      </Pressable>

      {/* Reglement Modal */}
      <Modal
        visible={showReglementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReglementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Règlement
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowReglementModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.modalScroll}
            >
              <ThemedText style={styles.reglementText}>
                {REGLEMENT_TEXT}
              </ThemedText>
              <Spacer height={20} />
            </ScrollView>
            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={() => {
                setAcceptedTerms(true);
                setShowReglementModal(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>
                J'accepte les conditions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    maxWidth: 440,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    marginBottom: 30,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 14,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
  },
  termsText: {
    fontSize: 13,
  },
  termsLink: {
    fontSize: 13,
    color: Colors.primary,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  button: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: Colors.warning,
    padding: 10,
    width: "90%",
    backgroundColor: "#f5c1c8",
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  linkRow: {
    textAlign: "center",
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: "underline",
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: "92%",
    maxWidth: 500,
    maxHeight: "80%",
    minHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e7ed",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 2,
  },
  modalScroll: {
    flex: 1,
  },
  reglementText: {
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: "left",
  },
  modalAcceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 15,
  },
  modalAcceptButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Register;