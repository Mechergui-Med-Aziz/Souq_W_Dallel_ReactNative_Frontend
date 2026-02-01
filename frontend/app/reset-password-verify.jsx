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
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import { Colors } from '../constants/Colors';

import { TextInput, ActivityIndicator, ScrollView } from 'react-native';

const ResetPasswordVerify = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [storedCode, setStoredCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const savedCode = await AsyncStorage.getItem('resetPasswordCode');
      const savedEmail = await AsyncStorage.getItem('resetPasswordEmail');
      
      if (savedCode) {
        setStoredCode(savedCode);
      }
      
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
      
      if (!savedCode || !savedEmail) {
        Alert.alert(
          'No Reset Request Found',
          'Please request a password reset first.',
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

  const handleResetPassword = async () => {
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

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Call backend to update password
      const response = await fetch('http://192.168.1.5:8080/api/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          newPassword: newPassword,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored data
        await AsyncStorage.multiRemove(['resetPasswordCode', 'resetPasswordEmail']);
        
        Alert.alert(
          'Success', 
          'Password reset successfully! You can now login with your new password.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
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
              Reset Password
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.card}>
              <Ionicons name="lock-closed" size={60} color={Colors.primary} />
              
              <Spacer height={20} />
              
              <ThemedText title style={styles.title}>
                Enter Verification Code
              </ThemedText>
              
              <ThemedText style={styles.description}>
                Enter the 6-digit code sent to:
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

              <Spacer height={30} />

              <ThemedTextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />

              <ThemedTextInput
                style={styles.input}
                placeholder="Confirm New Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />

              <Spacer height={30} />

              <ThemedButton
                onPress={handleResetPassword}
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
                    {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordVerify;