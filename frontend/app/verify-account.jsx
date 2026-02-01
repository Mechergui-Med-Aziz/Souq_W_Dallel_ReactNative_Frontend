import { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
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
import ThemedCard from '../components/ThemedCard';
import Spacer from '../components/Spacer';
import { Colors } from '../constants/Colors';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { verifyAccount } from '../store/slices/authSlice';
import { TextInput, ActivityIndicator } from 'react-native';

const VerifyAccount = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const dispatch = useAppDispatch();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [storedCode, setStoredCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    loadStoredData();
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadStoredData = async () => {
    try {
      const savedCode = await AsyncStorage.getItem('verificationCode');
      const savedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
      
      if (savedCode) {
        setStoredCode(savedCode);
        console.log('Loaded verification code:', savedCode);
      }
      
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
      
      if (!savedCode || !savedEmail) {
        Alert.alert(
          'No Verification Found',
          'Please register first to get a verification code.',
          [{ text: 'OK', onPress: () => router.replace('/register') }]
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

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    // Compare with stored code
    if (verificationCode !== storedCode) {
      Alert.alert('Invalid Code', 'The code you entered does not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Call backend to activate account
      await dispatch(verifyAccount({ 
        email: userEmail 
      })).unwrap();
      
      // Clear stored verification data
      await AsyncStorage.multiRemove(['verificationCode', 'pendingVerificationEmail']);
      
      Alert.alert(
        'Success', 
        'Account verified successfully! You can now login with your credentials.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
      
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', error || 'Failed to activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) {
      Alert.alert('Please Wait', `Please wait ${countdown} seconds before requesting a new code.`);
      return;
    }

    setResendLoading(true);

    try {
      // Resend Code : ToDo
      Alert.alert(
        'Resend Code',
        'To get a new verification code, please register again with the same email.',
        [{ text: 'OK' }]
      );
      
      // Reset countdown
      setCountdown(60);
      
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setResendLoading(false);
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
              Verify Account
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.card}>
              <Ionicons name="mail" size={60} color={Colors.primary} />
              
              <Spacer height={20} />
              
              <ThemedText title style={styles.title}>
                Verify Your Account
              </ThemedText>
              
              <ThemedText style={styles.description}>
                Enter the 6-digit verification code sent to:
              </ThemedText>
              
              <ThemedText style={styles.email}>
                {userEmail || 'your email'}
              </ThemedText>

              <Spacer height={30} />

              {/* Code Input Boxes */}
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

              <ThemedText style={styles.codeHint}>
                {storedCode ? `Debug: Code is ${storedCode}` : 'Enter the 6-digit code from your email'}
              </ThemedText>

              <Spacer height={30} />

              <ThemedButton
                onPress={handleVerify}
                disabled={loading || code.join('').length !== 6}
                style={[styles.verifyButton, (loading || code.join('').length !== 6) && styles.disabledButton]}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                  <ThemedText style={styles.buttonText}>
                    {loading ? 'Verifying...' : 'Verify Account'}
                  </ThemedText>
                </View>
              </ThemedButton>

              <Spacer height={20} />

              <View style={styles.resendContainer}>
                <TouchableOpacity 
                  onPress={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                  style={styles.resendButton}
                >
                  <Ionicons 
                    name="refresh-circle" 
                    size={20} 
                    color={countdown > 0 ? theme.iconColor : Colors.primary} 
                    style={{ marginRight: 5 }}
                  />
                  <ThemedText style={[
                    styles.resendButtonText,
                    (resendLoading || countdown > 0) && styles.resendDisabled
                  ]}>
                    {resendLoading ? 'Sending...' : `Resend Code ${countdown > 0 ? `(${countdown}s)` : ''}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedCard>

            <Spacer height={40} />

            <View style={styles.helpContainer}>
              <Ionicons name="information-circle" size={20} color={theme.iconColor} />
              <ThemedText style={styles.helpText}>
                • The code is valid for 10 minutes
              </ThemedText>
              <ThemedText style={styles.helpText}>
                • Check your spam folder if you don't see the email
              </ThemedText>
              <ThemedText style={styles.helpText}>
                • Contact support if you need assistance
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

// Add ScrollView import
import { ScrollView } from 'react-native';

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
  codeHint: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 10,
    textAlign: 'center',
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
  resendContainer: {
    alignItems: 'center',
    width: '100%',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  helpContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  helpText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
});

export default VerifyAccount;