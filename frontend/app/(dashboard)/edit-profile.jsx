import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  Keyboard, 
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { userService } from '../../store/services/userService';

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
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState(null);
  const [photoRefreshing, setPhotoRefreshing] = useState(false);

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
      });
      
      if (userData.photoId) {
        loadUserPhoto();
      } else {
        setUserPhotoUrl(null);
      }
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      await dispatch(fetchUserById(authUser.id)).unwrap();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserPhoto = async () => {
    if (!userData?.photoId) {
      setUserPhotoUrl(null);
      return;
    }

    try {
      setPhotoRefreshing(true);
      // Get fresh photo URL with timestamp to prevent caching
      const photoUrl = `${userService.getUserPhotoUrl(userData.id, userData.photoId)}?t=${Date.now()}`;
      setUserPhotoUrl(photoUrl);
    } catch (error) {
      console.error('Error loading user photo:', error);
      setUserPhotoUrl(null);
    } finally {
      setPhotoRefreshing(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
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
      const userUpdateData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        cin: parseInt(formData.cin),
        email: formData.email,
      };
      
      await dispatch(updateUser({
        id: authUser.id,
        userData: userUpdateData,
        photoFile: selectedImage
      })).unwrap();
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error) {
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

  const handleResetPassword = () => {
    router.push('/reset-password');
  };

  const displayInitial = () => {
    const name = formData.firstname || userData?.firstname || authUser?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        <View style={styles.formContainer}>
          <ThemedCard style={styles.formCard}>
            <View style={styles.photoSection}>
              <TouchableOpacity 
                style={styles.photoContainer}
                onPress={pickImage}
                disabled={photoRefreshing}
              >
                {selectedImage ? (
                  <Image 
                    source={{ uri: selectedImage.uri }} 
                    style={styles.profilePhoto}
                  />
                ) : userPhotoUrl && !photoRefreshing ? (
                  <Image 
                    source={{ uri: userPhotoUrl }} 
                    style={styles.profilePhoto}
                    onError={() => setUserPhotoUrl(null)}
                  />
                ) : (
                  <View style={styles.defaultPhoto}>
                    {photoRefreshing ? (
                      <ActivityIndicator size="large" color={Colors.primary} />
                    ) : (
                      <ThemedText style={styles.defaultPhotoText}>
                        {displayInitial()}
                      </ThemedText>
                    )}
                  </View>
                )}
                
                <View style={styles.photoEditButton}>
                  {photoRefreshing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              
              <ThemedText style={styles.photoLabel}>
                Profile Photo
              </ThemedText>

            </View>

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

              <Spacer height={35} />

              <ThemedButton
                onPress={handleResetPassword}
                style={styles.resetPasswordButton}
                variant="secondary"
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="lock-closed" size={22} color={Colors.primary} />
                  <ThemedText style={styles.resetPasswordButtonText}>
                    Reset Password
                  </ThemedText>
                </View>
              </ThemedButton>
            </View>
          </ThemedCard>

          <Spacer height={30} />

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
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  defaultPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  defaultPhotoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  removePhotoText: {
    fontSize: 12,
    color: Colors.warning,
    marginLeft: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
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
  buttonsContainer: {
    paddingHorizontal: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetPasswordButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: -20
  },
  resetPasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    color: Colors.primary,
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