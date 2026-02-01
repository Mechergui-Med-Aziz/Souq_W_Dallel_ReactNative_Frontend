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
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedButton from '../components/ThemedButton';
import ThemedTextInput from '../components/ThemedTextInput';
import ThemedCard from '../components/ThemedCard';
import Spacer from '../components/Spacer';
import { Colors } from '../constants/Colors';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import axiosInstance from '../lib/axios';

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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setNetworkError('');

    try {
      console.log('Attempting password reset...');
      const response = await axiosInstance.post('/api/reset-password', {
        cin: parseInt(formData.cin),
        email: formData.email,
      });

      console.log('Response received:', response.data);

      if (response.data.success) {
        Alert.alert('Success', response.data.message, [
          { 
            text: 'OK', 
            onPress: () => {
              router.replace('/login');
            }
          }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error details:', error);
      
      let errorMessage = 'Failed to reset password. ';
      
      if (error.response) {
        errorMessage += `Server error: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. ';
        errorMessage += 'Please check: \n1. Backend is running\n2. Correct IP address\n3. Network connection';
        setNetworkError('Cannot connect to server. Check backend is running.');
      } else {
        errorMessage += error.message || 'Network error';
      }
      
      Alert.alert('Error', errorMessage);
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
                Reset Your Password
              </ThemedText>
              
              <ThemedText style={styles.description}>
                Enter your CIN and email to receive a new password
              </ThemedText>

              {networkError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={20} color={Colors.warning} />
                  <ThemedText style={styles.errorText}>{networkError}</ThemedText>
                </View>
              ) : null}

              <Spacer height={30} />

              <ThemedTextInput
                style={styles.input}
                placeholder="CIN (8 digits)"
                keyboardType="numeric"
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

              <Spacer height={30} />

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
                    {loading ? 'Sending...' : 'Reset Password'}
                  </ThemedText>
                </View>
              </ThemedButton>

              <Spacer height={20} />

              <TouchableOpacity 
                onPress={() => router.push('/login')}
                style={styles.loginLink}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.primary} style={{ marginRight: 5 }} />
                <ThemedText style={styles.loginText}>
                  Back to Login
                </ThemedText>
              </TouchableOpacity>
            </ThemedCard>

            <Spacer height={30} />

            <View style={styles.helpContainer}>
              <Ionicons name="information-circle" size={20} color={theme.iconColor} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ThemedText style={styles.helpText}>
                  • A new password will be sent to your email
                </ThemedText>
                <ThemedText style={styles.helpText}>
                  • Make sure your CIN and email match your registration
                </ThemedText>
                <ThemedText style={styles.helpText}>
                  • Check spam folder if you don't receive the email
                </ThemedText>
              </View>
            </View>
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    color: Colors.warning,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
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
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  helpText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
});

export default ResetPassword;