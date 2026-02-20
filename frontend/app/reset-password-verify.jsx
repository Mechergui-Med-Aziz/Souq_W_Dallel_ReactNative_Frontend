import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedButton from '../components/ThemedButton';
import ThemedCard from '../components/ThemedCard';
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import { Colors } from '../constants/Colors';
import { authService } from '../store/services/authService';

const ResetPasswordVerify = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userCin, setUserCin] = useState('');
  const [step, setStep] = useState(1); // 1: code, 2: new password
  const inputRefs = useRef([]);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('resetPasswordEmail');
      const savedCin = await AsyncStorage.getItem('resetPasswordCin');
      
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
      
      if (savedCin) {
        setUserCin(savedCin);
      }
      
      if (!savedEmail || !savedCin) {
        Alert.alert(
          'Aucune demande trouvée',
          'Veuillez d\'abord demander un code de réinitialisation.',
          [{ text: 'OK', onPress: () => router.replace('/reset-password') }]
        );
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const focusNext = (index, value) => {
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index, key) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    focusNext(index, text);
  };

  const handleKeyPress = (event, index) => {
    focusPrev(index, event.nativeEvent.key);
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
      return;
    }

    // Since backend just expects the code in the URL, we just check if code is complete
    // The backend will validate the code via the URL parameter
    setStep(2);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez entrer et confirmer votre nouveau mot de passe');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const verificationCode = code.join('');
      
      // First, update the password with the code
      const result = await authService.updatePassword(
        userEmail, 
        userCin, 
        newPassword, 
        verificationCode
      );

      // Clear stored data
      await AsyncStorage.multiRemove(['resetPasswordEmail', 'resetPasswordCin']);
      
      Alert.alert(
        'Succès', 
        result.message,
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
      
    } catch (error) {
      console.error('Update password error:', error);
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
          <Spacer height={40} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              {step === 1 ? 'Vérification' : 'Nouveau mot de passe'}
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.card}>
              <Ionicons 
                name={step === 1 ? "mail" : "lock-closed"} 
                size={60} 
                color={Colors.primary} 
              />
              
              <Spacer height={20} />
              
              <ThemedText title style={styles.title}>
                {step === 1 ? 'Code de vérification' : 'Nouveau mot de passe'}
              </ThemedText>
              
              {step === 1 ? (
                <>
                  <ThemedText style={styles.description}>
                    Entrez le code à 6 chiffres envoyé à:
                  </ThemedText>
                  
                  <ThemedText style={styles.email}>
                    {userEmail}
                  </ThemedText>

                  <Spacer height={30} />

                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.codeInputWrapper,
                          digit && styles.codeInputFilled
                        ]}
                      >
                        <TextInput
                          ref={ref => inputRefs.current[index] = ref}
                          style={styles.codeInput}
                          value={digit}
                          onChangeText={(text) => handleChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={1}
                          selectTextOnFocus
                          editable={!loading}
                        />
                      </View>
                    ))}
                  </View>

                  <Spacer height={30} />

                  <ThemedButton
                    onPress={handleVerifyCode}
                    disabled={loading || code.join('').length !== 6}
                    style={[styles.verifyButton, (loading || code.join('').length !== 6) && styles.disabledButton]}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                      <ThemedText style={styles.buttonText}>
                        Vérifier
                      </ThemedText>
                    </View>
                  </ThemedButton>
                </>
              ) : (
                <>
                  <ThemedText style={styles.description}>
                    Choisissez un nouveau mot de passe sécurisé
                  </ThemedText>

                  <Spacer height={20} />

                  <ThemedTextInput
                    style={styles.input}
                    placeholder="Nouveau mot de passe"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!loading}
                  />

                  <ThemedTextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />

                  <Spacer height={20} />

                  <ThemedButton
                    onPress={handleUpdatePassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    style={[styles.verifyButton, (loading || !newPassword || !confirmPassword) && styles.disabledButton]}
                  >
                    <View style={styles.buttonContent}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="save" size={22} color="#fff" />
                      )}
                      <ThemedText style={styles.buttonText}>
                        {loading ? 'Mise à jour...' : 'Mettre à jour'}
                      </ThemedText>
                    </View>
                  </ThemedButton>
                </>
              )}
            </ThemedCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default ResetPasswordVerify;

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
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.primary,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  codeInputWrapper: {
    width: 45,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(104, 73, 167, 0.1)',
  },
  codeInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.primary,
    width: '100%',
    height: '100%',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  verifyButton: {
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