import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchNotifications,
  markAsRead,
  markMultipleAsRead
} from '../../store/slices/notificationSlice';
import { Colors } from '../../constants/Colors';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { userService } from '../../store/services/userService';

const Notifications = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector((state) => state.notifications);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [bidderNames, setBidderNames] = useState({});

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    // Extract bidder names from notification messages
    const extractBidderNames = async () => {
      const names = {};
      for (const notification of notifications) {
        if (notification.type === 'BID_PLACED' && notification.message.includes('a placé une enchère')) {
          // Try to extract bidder ID from message or metadata
          // This assumes your backend sends bidderId in the notification
          if (notification.bidderId && !names[notification.bidderId]) {
            try {
              const bidder = await userService.getUserById(notification.bidderId);
              const displayName = bidder?.firstname && bidder?.lastname 
                ? `${bidder.firstname} ${bidder.lastname}`.trim()
                : bidder?.email?.split('@')[0] || 'Un utilisateur';
              names[notification.bidderId] = displayName;
            } catch (error) {
              names[notification.bidderId] = 'Un utilisateur';
            }
          }
        }
      }
      setBidderNames(names);
    };
    
    if (notifications.length > 0) {
      extractBidderNames();
    }
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    if (selectionMode) {
      toggleSelection(notification.id);
    } else {
      // Mark as read if not already read
      if (!notification.read) {
        await dispatch(markAsRead(notification.id));
      }
      
      // Navigate to auction if it's a bid notification
      if (notification.auctionId) {
        router.push(`/auction-details/${notification.auctionId}`);
      }
    }
  };

  const handleLongPress = (id) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await dispatch(markMultipleAsRead(selectedIds)).unwrap();
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BID_PLACED':
        return 'hammer';
      case 'AUCTION_WON':
        return 'trophy';
      case 'AUCTION_LOST':
        return 'sad-outline';
      case 'AUCTION_ENDING':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'BID_PLACED':
        return Colors.primary;
      case 'AUCTION_WON':
        return '#fbbf24';
      case 'AUCTION_LOST':
        return '#ef4444';
      case 'AUCTION_ENDING':
        return '#3b82f6';
      default:
        return Colors.primary;
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr 
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const formatMessage = (notification) => {
    if (notification.type === 'BID_PLACED' && notification.bidderId && bidderNames[notification.bidderId]) {
      return `${bidderNames[notification.bidderId]} a placé une enchère de ${notification.bidAmount || ''} TND`;
    }
    return notification.message;
  };

  const renderNotification = ({ item }) => (
    <View>
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
        delayLongPress={300}
        style={[
          styles.notificationItem,
          !item.read && styles.unreadItem,
          selectionMode && selectedIds.includes(item.id) && styles.selectedItem
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer]}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={22}
              color={getNotificationColor(item.type)}
            />
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={[
              styles.message,
              !item.read && styles.unreadMessage
            ]} numberOfLines={2}>
              {formatMessage(item)}
            </ThemedText>
            <ThemedText style={styles.time}>
              {formatTime(item.createdAt)}
            </ThemedText>
          </View>

          {!item.read && !selectionMode && (
            <View style={styles.unreadDot} />
          )}

          {selectionMode && (
            <Ionicons
              name={selectedIds.includes(item.id) ? 'checkbox' : 'square-outline'}
              size={22}
              color={selectedIds.includes(item.id) ? Colors.primary : '#ccc'}
              style={styles.checkbox}
            />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />
    </View>
  );

  return (
    <ThemedView safe style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            Notifications
          </ThemedText>
          {unreadCount > 0 && !selectionMode && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadBadgeText}>
                {unreadCount}
              </ThemedText>
            </View>
          )}
          {selectionMode ? (
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectionButton}>
                <Ionicons
                  name={selectedIds.length === notifications.length ? 'checkmark-circle' : 'radio-button-off'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              {selectedIds.length > 0 && (
                <TouchableOpacity onPress={handleMarkSelectedAsRead} style={styles.selectionButton}>
                  <Ionicons name="checkmark-done" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSelectionMode(false)} style={styles.selectionButton}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerRight} />
          )}
        </View>
      </LinearGradient>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              Aucune notification
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Vous serez notifié lorsqu'une enchère reçoit une offre
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => null}
      />
    </ThemedView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  unreadBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 5,
  },
  unreadBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 15,
  },
  selectionButton: {
    padding: 5,
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#eae8e8',
  },
  selectedItem: {
    backgroundColor: Colors.primary + '10',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '400',
  },
  unreadMessage: {
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    position: 'absolute',
    top: 10,
    right: -3,
  },
  checkbox: {
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 72,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});