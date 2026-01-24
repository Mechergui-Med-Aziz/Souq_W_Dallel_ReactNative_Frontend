import { StyleSheet, View, ScrollView, Alert, Keyboard } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserById, updateUser } from '../../store/slices/userSlice';
import { Colors } from '../../constants/Colors';

const EditProfile = () => {
  const router = useRouter();
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
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        
        <ThemedText title={true} style={styles.title}>
          Edit Profile
        </ThemedText>
        
        <Spacer height={20} />

        <View style={styles.form}>
          <ThemedTextInput
            style={[styles.input, errors.firstname && styles.inputError]}
            placeholder="First Name *"
            value={formData.firstname}
            onChangeText={(value) => handleChange('firstname', value)}
          />
          {errors.firstname && <ThemedText style={styles.errorText}>{errors.firstname}</ThemedText>}

          <ThemedTextInput
            style={[styles.input, errors.lastname && styles.inputError]}
            placeholder="Last Name *"
            value={formData.lastname}
            onChangeText={(value) => handleChange('lastname', value)}
          />
          {errors.lastname && <ThemedText style={styles.errorText}>{errors.lastname}</ThemedText>}

          <ThemedTextInput
            style={[styles.input, errors.cin && styles.inputError]}
            placeholder="CIN *"
            keyboardType="numeric"
            value={formData.cin}
            onChangeText={(value) => handleChange('cin', value)}
          />
          {errors.cin && <ThemedText style={styles.errorText}>{errors.cin}</ThemedText>}

          <ThemedTextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email *"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
          />
          {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}

          <Spacer height={20} />

          <ThemedText style={styles.sectionTitle}>
            Change Password (optional)
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Leave blank to keep current password
          </ThemedText>

          <ThemedTextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="New Password"
            secureTextEntry
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
          {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}

          <ThemedTextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm New Password"
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
          />
          {errors.confirmPassword && <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>}
        </View>

        <Spacer height={30} />

        <View style={styles.buttonsContainer}>
          <ThemedButton
            onPress={handleSubmit}
            disabled={isSubmitting || loading}
            style={[styles.submitButton, (isSubmitting || loading) && styles.disabledButton]}
          >
            <ThemedText style={styles.buttonText}>
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </ThemedText>
          </ThemedButton>

          <Spacer height={15} />

          <ThemedButton
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={40} />

      </ThemedView>
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  buttonsContainer: {
    paddingHorizontal: 10,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});