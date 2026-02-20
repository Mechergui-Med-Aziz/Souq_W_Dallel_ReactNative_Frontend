import { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedButton from '../components/ThemedButton';
import ThemedTextInput from '../components/ThemedTextInput';
import ThemedCard from '../components/ThemedCard';
import Spacer from '../components/Spacer';
import { Colors } from '../constants/Colors';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { authService } from '../store/services/authService';

const ResetPassword = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const [formData, setFormData] = useState({
    cin: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setNetworkError('');
  };

  const handleSubmit = async () => {
    if (!formData.cin || !formData.email) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (formData.cin.length !== 8) {
      Alert.alert('Erreur', 'Le CIN doit contenir 8 chiffres');
      return;
    }

    setLoading(true);
    setNetworkError('');

    try {
      const result = await authService.resetPassword(formData.cin, formData.email);
      
      // Store email and cin for next step
      await AsyncStorage.setItem('resetPasswordEmail', formData.email);
      await AsyncStorage.setItem('resetPasswordCin', formData.cin);
      
      Alert.alert(
        'Code Envoyé', 
        result.message,
        [{ 
          text: 'Entrer le code', 
          onPress: () => router.push('/reset-password-verify')
        }]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Spacer height={10} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              Réinitialiser le mot de passe
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.card}>
              <Ionicons name="lock-closed" size={40} color={Colors.primary} />
              
              <Spacer height={10} />
              
              <ThemedText title style={styles.title}>
                Mot de passe oublié ?
              </ThemedText>
              
              <ThemedText style={styles.description}>
                Entrez votre CIN et votre email pour recevoir un code de vérification
              </ThemedText>

              <Spacer height={20} />

              <ThemedTextInput
                style={styles.input}
                placeholder="CIN (8 chiffres)"
                keyboardType="numeric"
                maxLength={8}
                onChangeText={(value) => handleChange('cin', value)}
                value={formData.cin}
                editable={!loading}
              />

              <ThemedTextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(value) => handleChange('email', value)}
                value={formData.email}
                editable={!loading}
              />

              <ThemedButton
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitButton, loading && styles.disabledButton]}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={22} color="#fff" />
                  )}
                  <ThemedText style={styles.buttonText}>
                    {loading ? 'Envoi...' : 'Envoyer le code'}
                  </ThemedText>
                </View>
              </ThemedButton>
            </ThemedCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    width: '100%',
    marginBottom: 20,
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ResetPassword;