import { StyleSheet, View, ScrollView, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import Spacer from "../../components/Spacer";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchUserById } from '../../store/slices/userSlice';
import { Colors } from '../../constants/Colors';

const Profile = () => {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const dispatch = useAppDispatch();
  const { 
    user: userData, 
    loading: userLoading, 
    error: userError 
  } = useAppSelector((state) => state.user);
  
  const [isLoading, setIsLoading] = useState(false);

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
              await logout();
              Alert.alert('Success', 'Logged out successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (userLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#fff" />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </View>
    );
  }

  const displayName = userData?.firstname || userData?.lastname 
    ? `${userData.firstname || ''} ${userData.lastname || ''}`.trim()
    : authUser?.email?.split('@')[0] || 'User';
  
  const displayEmail = authUser?.email || userData?.email || 'No email';
  const displayCIN = userData?.cin ? `CIN: ${userData.cin}` : '';
  const displayRole = userData?.role ? `Role: ${userData.role}` : '';

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Background Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.avatarGradient}
              >
                <ThemedText style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </ThemedText>
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>

            {/* User Info */}
            <ThemedText title={true} style={styles.userName}>
              {displayName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {displayEmail}
            </ThemedText>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={20} color="#fff" />
                <ThemedText style={styles.statText}>
                  {userData?.role || 'USER'}
                </ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="key-outline" size={20} color="#fff" />
                <ThemedText style={styles.statText}>
                  {userData?.cin || 'N/A'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <ThemedText title={true} style={styles.cardTitle}>
              Personal Information
            </ThemedText>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>First Name</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {userData?.firstname || 'Not set'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="people" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Last Name</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {userData?.lastname || 'Not set'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="card" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>CIN</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {userData?.cin || 'Not set'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Email</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {displayEmail}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Role</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {userData?.role || 'USER'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <Spacer height={20} />

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            <ThemedText title={true} style={styles.cardTitle}>
              Quick Actions
            </ThemedText>
          </View>
          
          <View style={styles.actionsGrid}>
            <ThemedButton 
              onPress={handleEditProfile}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Ionicons name="create-outline" size={24} color="#fff" />
                <ThemedText style={styles.actionText}>Edit Profile</ThemedText>
              </View>
            </ThemedButton>

            <ThemedButton 
              onPress={() => router.push('/(dashboard)')}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <View style={styles.actionContent}>
                <Ionicons name="home-outline" size={24} color="#fff" />
                <ThemedText style={styles.actionText}>Dashboard</ThemedText>
              </View>
            </ThemedButton>
          </View>
        </View>

        <Spacer height={20} />

        {/* Logout Button */}
        <ThemedButton 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </View>
        </ThemedButton>

        <Spacer height={40} />

        {/* Debug Info (only in development) */}
        {__DEV__ && userError && (
          <View style={styles.debugContainer}>
            <ThemedText style={styles.debugTitle}>Debug Info:</ThemedText>
            <ThemedText style={styles.debugText}>
              {typeof userError === 'string' ? userError : JSON.stringify(userError, null, 2)}
            </ThemedText>
          </View>
        )}

      </View>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerBackground: {
    height: 280,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ade80',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    padding: 20,
    marginTop: -40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
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
    color: '#333',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#667eea',
    borderRadius: 15,
    paddingVertical: 15,
  },
  secondaryButton: {
    backgroundColor: '#764ba2',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    paddingVertical: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
});