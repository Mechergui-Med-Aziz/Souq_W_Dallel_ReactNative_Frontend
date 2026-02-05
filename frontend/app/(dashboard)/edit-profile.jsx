import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  Keyboard, 
  TouchableOpacity 
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import ThemedCard from "../../components/ThemedCard";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserById, updateUser } from '../../store/slices/userSlice';
import { Colors } from '../../constants/Colors';
import AuthGuard from "../../components/auth/AuthGuard"

const EditProfile = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user: authUser } = useAuth();
  const dispatch = useAppDispatch();
  const { user: userData, loading } = useAppSelector((state) => state.user);
  
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    cin: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadUserData();
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (userData) {
      setFormData({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        cin: userData.cin ? String(userData.cin) : '',
        email: userData.email || authUser?.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      await dispatch(fetchUserById(authUser.id)).unwrap();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'First name is required';
    }
    
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Last name is required';
    }
    
    if (!formData.cin.trim()) {
      newErrors.cin = 'CIN is required';
    } else if (!/^\d+$/.test(formData.cin)) {
      newErrors.cin = 'CIN must contain only numbers';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        cin: parseInt(formData.cin),
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {})
      };
      
      await dispatch(updateUser({
        id: authUser.id,
        userData: updateData
      })).unwrap();
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AuthGuard userOnly redirectTo="/(auth)/login">
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/profile')} style={styles.backButton}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.iconColorFocused} 
              />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              Edit Profile
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <ThemedCard style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
              <ThemedText title style={styles.formTitle}>
                Update Your Information
              </ThemedText>
              <ThemedText style={styles.formSubtitle}>
                Make changes to your profile details
              </ThemedText>
            </View>

            {/* Personal Information */}
            <View style={styles.section}>
              <ThemedText title style={styles.sectionTitle}>
                Personal Information
              </ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>First Name </ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.firstname && styles.inputError]}
                  placeholder="Enter your first name"
                  value={formData.firstname}
                  onChangeText={(value) => handleChange('firstname', value)}
                />
                {errors.firstname && <ThemedText style={styles.errorText}>{errors.firstname}</ThemedText>}

                <ThemedText style={styles.inputLabel}>Last Name </ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.lastname && styles.inputError]}
                  placeholder="Enter your last name"
                  value={formData.lastname}
                  onChangeText={(value) => handleChange('lastname', value)}
                />
                {errors.lastname && <ThemedText style={styles.errorText}>{errors.lastname}</ThemedText>}

                <ThemedText style={styles.inputLabel}>CIN </ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.cin && styles.inputError]}
                  placeholder="Enter your CIN number"
                  keyboardType="numeric"
                  value={formData.cin}
                  onChangeText={(value) => handleChange('cin', value)}
                />
                {errors.cin && <ThemedText style={styles.errorText}>{errors.cin}</ThemedText>}

                <ThemedText style={styles.inputLabel}>Email </ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                />
                {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
              </View>
            </View>

            {/* Password Reset Link */}
            <View style={styles.section}>
              <ThemedText title style={styles.sectionTitle}>
                Password
              </ThemedText>
              
              <TouchableOpacity 
                style={styles.resetPasswordLink}
                onPress={() => router.push('/reset-password')}
              >
                <Ionicons name="key-outline" size={20} color={Colors.primary} />
                <ThemedText style={styles.resetPasswordText}>
                  Reset Password
                </ThemedText>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.iconColor} 
                  style={{ marginLeft: 'auto' }} 
                />
              </TouchableOpacity>
              
              <ThemedText style={styles.resetPasswordDescription}>
                Need to change your password? Click above to request a password reset email.
              </ThemedText>
            </View>
          </ThemedCard>

          <Spacer height={30} />

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <ThemedButton
              onPress={handleSubmit}
              disabled={isSubmitting || loading}
              style={[styles.submitButton, (isSubmitting || loading) && styles.disabledButton]}
            >
              <View style={styles.buttonContent}>
                <Ionicons 
                  name={isSubmitting ? "time-outline" : "checkmark-circle"} 
                  size={22} 
                  color="#fff" 
                />
                <ThemedText style={styles.buttonText}>
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </ThemedText>
              </View>
            </ThemedButton>

            <Spacer height={15} />

            <ThemedButton
              onPress={() => router.back()}
              style={styles.cancelButton}
              variant="secondary"
            >
              <View style={styles.buttonContent}>
                <Ionicons name="close-circle" size={22} color={theme.text} />
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </View>
            </ThemedButton>
          </View>

          <Spacer height={40} />
        </View>
      </ScrollView>
    </ThemedView>
    </AuthGuard>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  formContainer: {
    padding: 20,
  },
  formCard: {
    borderRadius: 20,
    padding: 25,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    marginTop: 15,
    opacity: 0.8,
  },
  input: {
    padding: 14,
    fontSize: 16,
    fontWeight: 'bold',
    borderRadius: 10,
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  resetPasswordLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetPasswordText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    color: Colors.primary,
  },
  resetPasswordDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 10,
    lineHeight: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 16,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});