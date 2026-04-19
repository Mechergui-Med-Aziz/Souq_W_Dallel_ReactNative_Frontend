import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, ScrollView, Platform, Keyboard, View, Pressable } from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from '../../components/Spacer';
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";
import { showAlert } from '../../utils/alertHelper';

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    cin: '',
    email: '',
    password: '',
    role: 'USER'
  });
  
  const { register, loading, error } = useAuth();
  const router = useRouter();

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

          <ThemedButton 
            onPress={handleSubmit} 
            disabled={loading}
            style={[styles.button, loading && styles.disabledButton]}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 14,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: Colors.warning,
    padding: 10,
    width: '90%',
    backgroundColor: '#f5c1c8',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  linkRow: {
    textAlign: 'center',
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Register;