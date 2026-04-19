import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from '../../components/ThemedTextInput';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { showAlert } from '../../utils/alertHelper';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      showAlert('Erreur', 'Veuillez entrer votre email et mot de passe');
      return;
    }
    
    try {
      const result = await login(email, password);
      
      if (result.payload && result.payload.needsVerification) {
        if (result.payload.code) {
          await AsyncStorage.setItem('verificationCode', result.payload.code);
          await AsyncStorage.setItem('pendingVerificationEmail', email);
          await AsyncStorage.setItem('pendingRegistrationPassword', password);
        }
        
        showAlert(
          'Vérification requise',
          'Votre compte nécessite une vérification. Un nouveau code a été envoyé à votre email.',
        );
        router.replace('/verify-account');
        return;
      }
      
    } catch (err) {
      let errorMessage = 'Échec de la connexion. Vérifiez vos identifiants.';
      if (err && err.includes && err.includes('No response')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      showAlert('Erreur de connexion', errorMessage);
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.formContainer}>
        <Spacer height={40} />
        
        <ThemedText title={true} style={styles.title}>
          Connexion
        </ThemedText>

        <ThemedTextInput
          style={styles.input}
          icon="mail-outline"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
          value={email}
        />

        <ThemedTextInput
          style={styles.input}
          icon="lock-closed-outline"
          placeholder="Mot de passe"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <ThemedButton 
          onPress={handleSubmit} 
          disabled={loading}
          style={[styles.button, loading && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </ThemedButton>

        <Spacer />

        {error && (
          <Text style={styles.error}>
            {error}
          </Text>
        )}

        <Spacer height={30} />

        <TouchableOpacity onPress={() => router.push('/register')}>
          <ThemedText style={styles.linkRow}>
            Pas encore de compte ?{' '}
            <Text style={styles.linkText}>S'inscrire</Text>
          </ThemedText>
        </TouchableOpacity>

        <Spacer height={12} />

        <TouchableOpacity onPress={() => router.push('/reset-password')}>
          <Text style={styles.linkText}>
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
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

export default Login;