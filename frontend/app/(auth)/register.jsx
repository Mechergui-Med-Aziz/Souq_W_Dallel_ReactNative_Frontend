import { useState } from "react";
import { StyleSheet, Text, Alert, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useRouter } from "expo-router";
import { Keyboard } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from '../../components/Spacer';
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";

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

  const handleSubmit = async () => {
    if (!formData.firstname || !formData.lastname || !formData.cin || !formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (formData.cin.length !== 8) {
      Alert.alert('Erreur', 'Le CIN doit contenir 8 chiffres');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
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
        
        Alert.alert(
          'Inscription réussie !',
          `Un code de vérification a été envoyé à ${formData.email}. Vous serez automatiquement connecté après vérification.`,
          [{ 
            text: 'Vérifier maintenant', 
            onPress: () => router.replace('/verify-account') 
          }]
        );
      }
      
    } catch (err) {
      Alert.alert('Échec de l\'inscription', err || 'Veuillez réessayer.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView safe style={styles.container}>
        <Spacer height={40} />
        
        <ThemedText title={true} style={styles.title}>
          Inscription
        </ThemedText>

        <ThemedTextInput
          style={styles.input}
          placeholder="Prénom"
          onChangeText={(value) => handleChange('firstname', value)}
          value={formData.firstname}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Nom"
          onChangeText={(value) => handleChange('lastname', value)}
          value={formData.lastname}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="CIN (8 chiffres)"
          keyboardType="numeric"
          maxLength={8}
          onChangeText={(value) => handleChange('cin', value)}
          value={formData.cin}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('email', value)}
          value={formData.email}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Mot de passe (min. 6 caractères)"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('password', value)}
          value={formData.password}
          secureTextEntry
        />

        <ThemedButton 
          onPress={handleSubmit} 
          disabled={loading}
          style={loading && styles.disabledButton}
        >
          <Text style={{ color: '#f2f2f2'}}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </Text>
        </ThemedButton>

        <Spacer />

        {error && <Text style={styles.error}> {error} </Text>}

        <Spacer height={40} />

        <TouchableOpacity onPress={() => router.push('/login')}>
          <ThemedText style={{ textAlign: 'center'}}>
            Déjà un compte ? Se connecter
          </ThemedText>
        </TouchableOpacity>

        <Spacer height={20} />

        <TouchableOpacity onPress={() => router.push('/reset-password')}>
          <ThemedText style={{ textAlign: 'center', color: Colors.primary }}>
            Mot de passe oublié ?
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  error: {
    color: Colors.warning,
    padding: 10,
    width: '90%',
    backgroundColor: '#f5c1c8',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default Register;