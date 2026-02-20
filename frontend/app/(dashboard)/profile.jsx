import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'react-native';
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserById, updateUser, deleteUserPhoto } from '../../store/slices/userSlice';
import { Colors } from '../../constants/Colors';
import { userService } from '../../store/services/userService';

const Profile = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user: authUser, logout } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    user: userData, 
    loading: userLoading, 
    error: userError,
    photoLoading
  } = useAppSelector((state) => state.user);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState(null);
  const [photoRefreshing, setPhotoRefreshing] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadUserDataAndPhoto();
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (userData?.photoId) {
      loadUserPhoto();
    } else {
      setUserPhotoUrl(null);
    }
  }, [userData?.photoId, userData?.id]);

  const loadUserDataAndPhoto = async () => {
    try {
      setIsLoading(true);
      
      // Load user data first
      await dispatch(fetchUserById(authUser.id)).unwrap();
      
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.status === 404) {
        Alert.alert('Info', 'User profile not found. Some information may be limited.');
      }
    } finally {
      setIsLoading(false);
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
      setPhotoModalVisible(true);
    }
  };

  // For futur use
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setPhotoModalVisible(true);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage || !authUser?.id) return;

    try {
      setIsLoading(true);
      
      await dispatch(updateUser({
        id: authUser.id,
        userData: {
          firstname: userData?.firstname || '',
          lastname: userData?.lastname || '',
          cin: userData?.cin || 0,
          email: userData?.email || '',
        },
        photoFile: selectedImage
      })).unwrap();
      
      // Reload user data to get updated photoId
      await loadUserDataAndPhoto();
      Alert.alert('Success', 'Profile photo updated!');
      setPhotoModalVisible(false);
      setSelectedImage(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(dashboard)/edit-profile');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
              
              Alert.alert('Success', 'Logged out successfully!', [
                { 
                  text: 'OK', 
                  onPress: () => {
                    router.replace('/(auth)/login');
                  }
                }
              ]);
              
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  if (userLoading || isLoading || isLoggingOut) {
    return (
      <ThemedView safe style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.primary, '#764ba2']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#fff" />
        <ThemedText style={styles.loadingText}>
          {isLoggingOut ? 'Logging out...' : 'Loading profile...'}
        </ThemedText>
      </ThemedView>
    );
  }

  const displayName = userData?.firstname || userData?.lastname 
    ? `${userData.firstname || ''} ${userData.lastname || ''}`.trim()
    : authUser?.email?.split('@')[0] || 'User';
  
  const displayEmail = authUser?.email || userData?.email || 'No email';

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              Profile
            </ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEditProfile} style={styles.headerIcon}>
                <Ionicons name="create-outline" size={22} color={theme.iconColorFocused} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleLogout} 
                disabled={isLoggingOut}
                style={styles.headerIcon}
              >
                <Ionicons 
                  name="log-out-outline" 
                  size={22} 
                  color={Colors.warning} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <ThemedCard style={styles.profileHeaderCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={pickImage}
              disabled={photoLoading || photoRefreshing}
            >
              {userPhotoUrl && !photoRefreshing ? (
                <Image 
                  source={{ uri: userPhotoUrl }} 
                  style={styles.avatarImage}
                  onError={() => setUserPhotoUrl(null)}
                />
              ) : (
                <LinearGradient
                  colors={[Colors.primary, '#764ba2']}
                  style={styles.avatarGradient}
                >
                  {photoRefreshing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.avatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </ThemedText>
                  )}
                </LinearGradient>
              )}
              
              <View style={styles.photoEditButton}>
                {photoRefreshing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            <ThemedText title style={styles.userName}>
              {displayName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {displayEmail}
            </ThemedText>
                          
          </ThemedCard>

          <Spacer height={20} />

          <ThemedCard style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
              <ThemedText title style={styles.cardTitle}>
                Personal Information
              </ThemedText>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: theme.uiBackground }]}>
                  <Ionicons name="person" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>First Name</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {userData?.firstname || 'Not set'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: theme.uiBackground }]}>
                  <Ionicons name="people" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Last Name</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {userData?.lastname || 'Not set'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: theme.uiBackground }]}>
                  <Ionicons name="card" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>CIN</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {userData?.cin || 'Not set'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: theme.uiBackground }]}>
                  <Ionicons name="mail" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Email</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {displayEmail}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={40} />
        </View>
      </ScrollView>

      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText title style={styles.modalTitle}>
              Preview Photo
            </ThemedText>
            
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.previewImage}
              />
            )}
            
            <View style={styles.modalActions}>
              <ThemedButton
                onPress={() => setPhotoModalVisible(false)}
                style={styles.modalButton}
                variant="secondary"
              >
                <ThemedText>Cancel</ThemedText>
              </ThemedButton>
              
              <ThemedButton
                onPress={uploadPhoto}
                disabled={isLoading}
                style={styles.modalButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff' }}>Upload</ThemedText>
                )}
              </ThemedButton>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 15,
    padding: 5,
  },
  content: {
    padding: 20,
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: Colors.primary,
  },
  photoActionTextDisabled: {
    color: '#999',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoGrid: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});