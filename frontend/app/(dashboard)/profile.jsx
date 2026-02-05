import { StyleSheet, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedCard from "../../components/ThemedCard";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserById } from '../../store/slices/userSlice';
import { Colors } from '../../constants/Colors';
import AuthGuard from "../../components/auth/AuthGuard"

const Profile = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user: authUser, logout } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    user: userData, 
    loading: userLoading, 
    error: userError 
  } = useAppSelector((state) => state.user);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadUserData();
    }
  }, [authUser?.id]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
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
              
              // Show success message
              Alert.alert('Success', 'Logged out successfully!', [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Force navigation to login after successful logout
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
    <AuthGuard userOnly redirectTo="/(auth)/login">
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back and Action Buttons */}
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <View style={styles.headerContent}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme.iconColorFocused} 
              onPress={() => router.back()}
              style={styles.headerIcon}
            />
            <ThemedText title style={styles.headerTitle}>
              Profile
            </ThemedText>
            <View style={styles.headerActions}>
              <Ionicons 
                name="create-outline" 
                size={22} 
                color={theme.iconColorFocused} 
                onPress={handleEditProfile}
                style={styles.headerIcon}
              />
              <Ionicons 
                name="log-out-outline" 
                size={22} 
                color={Colors.warning} 
                onPress={handleLogout}
                style={[styles.headerIcon, isLoggingOut && styles.disabledIcon]}
                disabled={isLoggingOut}
              />
            </View>
          </View>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Profile Header Card */}
          <ThemedCard style={styles.profileHeaderCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, '#764ba2']}
                style={styles.avatarGradient}
              >
                <ThemedText style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </ThemedText>
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>

            <ThemedText title style={styles.userName}>
              {displayName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {displayEmail}
            </ThemedText>
          </ThemedCard>

          <Spacer height={20} />

          {/* Personal Information Card */}
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

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: theme.uiBackground }]}>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Role</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {userData?.role || 'USER'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={40} />

          {/* Debug Info (only in development) */}
          {__DEV__ && userError && (
            <View style={[styles.debugContainer, { backgroundColor: theme.uiBackground }]}>
              <ThemedText style={styles.debugTitle}>Debug Info:</ThemedText>
              <ThemedText style={styles.debugText}>
                {typeof userError === 'string' ? userError : JSON.stringify(userError, null, 2)}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
    </AuthGuard>
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
  disabledIcon: {
    opacity: 0.5,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#fff',
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
  debugContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
});