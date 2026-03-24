import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput,
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { 
  fetchAllAuctions, 
  approveAuction, 
  denyAuction 
} from '../../store/slices/auctionSlice';
import { 
  fetchAllParcels,
  fetchParcelsByAdmin, 
  updateParcel, 
  deliverParcel 
} from '../../store/slices/parcelSlice';
import { 
  fetchNotifications, 
  markAsRead, 
  markMultipleAsRead 
} from '../../store/slices/notificationSlice';
import { fetchAllDeposits } from '../../store/slices/depositSlice';
import { userService } from '../../store/services/userService';
import { auctionService } from '../../store/services/auctionService';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const isLargeScreen = screenWidth >= 768;

const AdminDashboard = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { auctions, loading } = useAppSelector((state) => state.auction);
  const { adminParcels } = useAppSelector((state) => state.parcel);
  const { deposits } = useAppSelector((state) => state.deposit);
  const { notifications } = useAppSelector((state) => state.notifications);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // Data state
  const [users, setUsers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userNames, setUserNames] = useState({});
  
  // Modal state
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [auctionPhotos, setAuctionPhotos] = useState([]);
  const [auctionModalVisible, setAuctionModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  const [blockDays, setBlockDays] = useState('7');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedParcelForAssign, setSelectedParcelForAssign] = useState(null);
  
  // Filter state
  const [dateFilter, setDateFilter] = useState('week');
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  
  // UI state
  const [auctionFilter, setAuctionFilter] = useState('all');
  const [parcelFilter, setParcelFilter] = useState('all');
  const [processingUserId, setProcessingUserId] = useState(null);
  const [processingAuctionId, setProcessingAuctionId] = useState(null);
  const [processingParcelId, setProcessingParcelId] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [allParcels, setAllParcels] = useState([]);
  const [adminParcelsList, setAdminParcels] = useState([]);
  const [pickUpAdress, setPickUpAdress] = useState('');
  const [destinationAdress, setDestinationAdress] = useState('');
  const [selectedAuctionForDeposits, setSelectedAuctionForDeposits] = useState(null);
  const [auctionNames, setAuctionNames] = useState({});
  
  // Admin notifications state
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [notificationSelectionMode, setNotificationSelectionMode] = useState(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([]);
  
  // Stats
  const [auctionCounts, setAuctionCounts] = useState({
    active: 0,
    pending: 0,
    denied: 0,
    ended: 0
  });

  const [depositStats, setDepositStats] = useState({
    total: 0,
    auction: 0,
    bids: 0
  });
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAuctions: 0,
    totalDeposits: 0,
    activeAuctions: 0,
    endedAuctions: 0,
    pendingAuctions: 0,
    deniedAuctions: 0,
    totalParcels: 0,
    pendingParcels: 0,
    deliveredParcels: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeMenu === 'parcels') {
      loadParcels();
    }
  }, [activeMenu]);

  useEffect(() => {
    const loadAuctionNames = async () => {
      const names = {};
      for (const deposit of deposits) {
        if (deposit.auctionId && !names[deposit.auctionId]) {
          const auction = auctions.find(a => a.id === deposit.auctionId);
          if (auction) {
            names[deposit.auctionId] = auction.title;
          } else {
            try {
              const auctionData = await auctionService.getAuctionById(deposit.auctionId);
              names[deposit.auctionId] = auctionData.title;
            } catch (error) {
              names[deposit.auctionId] = `ID: ${deposit.auctionId.substring(0, 8)}...`;
            }
          }
        }
      }
      setAuctionNames(names);
    };
    
    if (deposits.length > 0) {
      loadAuctionNames();
    }
  }, [deposits, auctions]);

  useEffect(() => {
    if (deposits.length > 0) {
      const auctionTotal = deposits
        .filter(d => d.type === 'AUCTION')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      const bidsTotal = deposits
        .filter(d => d.type === 'BIDS')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      setDepositStats({
        total: stats.totalDeposits,
        auction: auctionTotal,
        bids: bidsTotal
      });
    }
  }, [deposits, stats.totalDeposits]);

  useEffect(() => {
    if (deposits.length > 0) {
      filterDepositsByDate();
    }
  }, [deposits, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    loadUserNames();
  }, [auctions, adminParcels, users]);

  const loadUserNames = async () => {
    const nameMap = {};
    
    // Load seller names for auctions
    for (const auction of auctions) {
      if (auction.sellerId && !nameMap[auction.sellerId]) {
        try {
          const seller = await userService.getUserById(auction.sellerId);
          nameMap[auction.sellerId] = seller ? 
            `${seller.firstname || ''} ${seller.lastname || ''}`.trim() || seller.email : 
            `ID: ${auction.sellerId.substring(0, 8)}...`;
        } catch (error) {
          nameMap[auction.sellerId] = `ID: ${auction.sellerId.substring(0, 8)}...`;
        }
      }
    }
    
    // Load buyer names for parcels
    for (const parcel of adminParcels) {
      if (parcel.buyerId && !nameMap[parcel.buyerId]) {
        try {
          const buyer = await userService.getUserById(parcel.buyerId);
          nameMap[parcel.buyerId] = buyer ? 
            `${buyer.firstname || ''} ${buyer.lastname || ''}`.trim() || buyer.email : 
            `ID: ${parcel.buyerId.substring(0, 8)}...`;
        } catch (error) {
          nameMap[parcel.buyerId] = `ID: ${parcel.buyerId.substring(0, 8)}...`;
        }
      }
      
      if (parcel.transporterId && !nameMap[parcel.transporterId]) {
        try {
          const transporter = await userService.getUserById(parcel.transporterId);
          nameMap[parcel.transporterId] = transporter ? 
            `${transporter.firstname || ''} ${transporter.lastname || ''}`.trim() || transporter.email : 
            `ID: ${parcel.transporterId.substring(0, 8)}...`;
        } catch (error) {
          nameMap[parcel.transporterId] = `ID: ${parcel.transporterId.substring(0, 8)}...`;
        }
      }
    }
    
    setUserNames(nameMap);
  };

  const loadDashboardData = async () => {
    try {
      await dispatch(fetchAllAuctions()).unwrap();
      await dispatch(fetchAllDeposits()).unwrap(); 
      
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      
      const transportersData = await userService.getAllTransporters();
      setTransporters(transportersData);
      
      // Load parcels for admin
      await loadParcels();
      
      // Load admin notifications
      if (user?.id) {
        const result = await dispatch(fetchNotifications(user.id)).unwrap();
        const filtered = result.filter(notif => 
          notif.type === 'AUCTION_PENDING' || 
          notif.type === 'PARCEL_INVALID'
        );
        setAdminNotifications(filtered);
      }
      
      calculateStats(usersData, auctions, deposits, adminParcels);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Erreur', 'Impossible de charger certaines données');
    }
  };

  const loadParcels = async () => {
    try {
      // Fetch all parcels
      const result = await dispatch(fetchAllParcels()).unwrap();
      setAllParcels(result || []);
      
      const filteredParcels = (result || []).filter(p => {
        // If parcel has no adminId, show it (legacy parcels)
        if (!p.adminId) {
          console.log('Showing legacy parcel without adminId:', p.id);
          return true;
        }
        // If parcel has adminId, only show if it matches current admin
        return p.adminId === user?.id;
      });
      
      setAdminParcels(filteredParcels);
      
      // Update stats with filtered parcels
      calculateStats(users, auctions, deposits, filteredParcels);
      
      console.log('All parcels:', result);
      console.log('Filtered parcels for admin:', filteredParcels);
      console.log('Current admin ID:', user?.id);
      
    } catch (error) {
      console.error('Error loading parcels:', error);
    }
  };

  const renderDepositFilters = () => (
    <View style={styles.filterSection}>
      <ThemedText style={styles.filterTitle}>Filtrer par enchère:</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedAuctionForDeposits && styles.filterChipActive
          ]}
          onPress={() => setSelectedAuctionForDeposits(null)}
        >
          <ThemedText style={[
            styles.filterChipText,
            !selectedAuctionForDeposits && styles.filterChipTextActive
          ]}>
            Toutes
          </ThemedText>
        </TouchableOpacity>
        {Object.entries(auctionNames).map(([auctionId, name]) => (
          <TouchableOpacity
            key={auctionId}
            style={[
              styles.filterChip,
              selectedAuctionForDeposits === auctionId && styles.filterChipActive
            ]}
            onPress={() => setSelectedAuctionForDeposits(auctionId)}
          >
            <ThemedText style={[
              styles.filterChipText,
              selectedAuctionForDeposits === auctionId && styles.filterChipTextActive
            ]}>
              {name.length > 20 ? name.substring(0, 20) + '...' : name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const filterDepositsByDate = () => {
    if (!deposits.length) {
      setFilteredDeposits([]);
      return;
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateFilter) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date();
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        endDate = new Date();
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(0);
        endDate = new Date();
    }

    const filtered = deposits.filter(deposit => {
      const depositDate = new Date(deposit.createdAt || Date.now());
      const matchesDate = depositDate >= startDate && depositDate <= endDate;
      const matchesAuction = !selectedAuctionForDeposits || deposit.auctionId === selectedAuctionForDeposits;
      return matchesDate && matchesAuction;
    });

    setFilteredDeposits(filtered);
  };

  const calculateStats = (usersData, auctionsData, depositsData, parcelsData) => {
    const now = new Date();
    
    const activeAuctions = auctionsData.filter(a => 
      a.status === 'active' && new Date(a.expireDate) > now
    ).length;
    
    const endedAuctions = auctionsData.filter(a => 
      a.status === 'ended' || new Date(a.expireDate) <= now
    ).length;
    
    const pendingAuctions = auctionsData.filter(a => 
      a.status === 'pending'
    ).length;
    
    const deniedAuctions = auctionsData.filter(a => 
      a.status === 'denied'
    ).length;
    
    setAuctionCounts({
      active: activeAuctions,
      pending: pendingAuctions,
      denied: deniedAuctions,
      ended: endedAuctions
    });
    
    // Fix parcels counts - ensure parcelsData is an array
    const parcelsArray = parcelsData || [];
    const pendingParcels = parcelsArray.filter(p => !p.delivred).length;
    const deliveredParcels = parcelsArray.filter(p => p.delivred).length;
    
    const totalDepositAmount = depositsData.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    setStats({
      totalUsers: usersData.length,
      totalAuctions: auctionsData.length,
      totalDeposits: totalDepositAmount,
      activeAuctions,
      endedAuctions,
      pendingAuctions,
      deniedAuctions,
      totalParcels: parcelsArray.length,
      pendingParcels,
      deliveredParcels
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (activeMenu === 'parcels') {
      await loadParcels();
    }
    setRefreshing(false);
  };

  const getUserName = (userId) => {
    return userNames[userId] || `ID: ${userId?.substring(0, 8)}...`;
  };

  const handleAuctionPress = async (auction) => {
    try {
      const photos = [];
      if (auction.photoId && auction.photoId.length > 0) {
        for (const photoId of auction.photoId) {
          const photoUrl = auctionService.getAuctionPhotoUrl(auction.id, photoId);
          photos.push(photoUrl);
        }
      }
      setAuctionPhotos(photos);
      setSelectedAuction(auction);
      setAuctionModalVisible(true);
    } catch (error) {
      console.error('Error loading auction details:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'enchère');
    }
  };

  const handleApproveAuction = async (auctionId) => {
    Alert.alert(
      'Approuver l\'enchère',
      'Êtes-vous sûr de vouloir approuver cette enchère ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              setProcessingAuctionId(auctionId);
              await dispatch(approveAuction({ auctionId, adminId: user.id })).unwrap();
              Alert.alert('Succès', 'Enchère approuvée avec succès');
              await loadDashboardData();
            } catch (error) {
              Alert.alert('Erreur', 'Échec de l\'approbation');
            } finally {
              setProcessingAuctionId(null);
            }
          }
        }
      ]
    );
  };

  const handleDenyAuction = async (auctionId) => {
    Alert.alert(
      'Refuser l\'enchère',
      'Êtes-vous sûr de vouloir refuser cette enchère ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAuctionId(auctionId);
              await dispatch(denyAuction({ auctionId, adminId: user.id })).unwrap();
              Alert.alert('Succès', 'Enchère refusée');
              await loadDashboardData();
            } catch (error) {
              Alert.alert('Erreur', 'Échec du refus');
            } finally {
              setProcessingAuctionId(null);
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification) => {
    if (notificationSelectionMode) {
      toggleNotificationSelection(notification.id);
    } else {
      try {
        await dispatch(markAsRead(notification.id)).unwrap();
        const updated = adminNotifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        );
        setAdminNotifications(updated);
        
        if (notification.type === 'AUCTION_PENDING' && notification.auctionId) {
          setActiveMenu('auctions');
          setAuctionFilter('pending');
          const auction = auctions.find(a => a.id === notification.auctionId);
          if (auction) {
            handleAuctionPress(auction);
          }
        } else if (notification.type === 'PARCEL_INVALID' && notification.auctionId) {
          setActiveMenu('parcels');
          setParcelFilter('all');
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleLongPressNotification = (id) => {
    setNotificationSelectionMode(true);
    setSelectedNotificationIds([id]);
  };

  const toggleNotificationSelection = (id) => {
    setSelectedNotificationIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotificationIds.length === 0) return;
    
    try {
      await dispatch(markMultipleAsRead(selectedNotificationIds)).unwrap();
      const updated = adminNotifications.map(n => 
        selectedNotificationIds.includes(n.id) ? { ...n, read: true } : n
      );
      setAdminNotifications(updated);
      setSelectedNotificationIds([]);
      setNotificationSelectionMode(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    }
  };

  const handleSelectAllNotifications = () => {
    if (selectedNotificationIds.length === adminNotifications.length) {
      setSelectedNotificationIds([]);
    } else {
      setSelectedNotificationIds(adminNotifications.map(n => n.id));
    }
  };

  const handleBlockUser = (userId) => {
    setSelectedUserForBlock(userId);
    setBlockDays('7');
    setBlockModalVisible(true);
  };

  const confirmBlockUser = async () => {
    if (!selectedUserForBlock) return;
    
    setBlockLoading(true);
    try {
      await userService.blockUserWithDays(selectedUserForBlock, parseInt(blockDays));
      Alert.alert('Succès', `Utilisateur bloqué pour ${blockDays} jours`);
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
      setBlockModalVisible(false);
      setSelectedUserForBlock(null);
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Erreur', 'Échec du blocage. Veuillez réessayer.');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    setUnblockLoading(true);
    setProcessingUserId(userId);
    try {
      await userService.unblockUser(userId);
      Alert.alert('Succès', 'Utilisateur débloqué avec succès');
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Erreur', 'Échec du déblocage. Veuillez réessayer.');
    } finally {
      setUnblockLoading(false);
      setProcessingUserId(null);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    try {
      setProcessingUserId(userId);
      if (currentRole === 'ADMIN') {
        await userService.makeUser(userId);
        Alert.alert('Succès', 'Utilisateur rétrogradé en utilisateur standard');
      } else if (currentRole === 'Transporter') {
        await userService.makeUser(userId);
        Alert.alert('Succès', 'Utilisateur rétrogradé en utilisateur standard');
      } else {
        await userService.makeAdmin(userId);
        Alert.alert('Succès', 'Utilisateur promu administrateur');
      }
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
      const updatedTransporters = await userService.getAllTransporters();
      setTransporters(updatedTransporters);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la modification du rôle');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleMakeTransporter = async (userId) => {
    try {
      setProcessingUserId(userId);
      await userService.makeTransporter(userId);
      Alert.alert('Succès', 'Utilisateur promu transporteur');
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
      const updatedTransporters = await userService.getAllTransporters();
      setTransporters(updatedTransporters);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la promotion');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRemoveTransporter = async (userId) => {
    try {
      setProcessingUserId(userId);
      await userService.removeTransporter(userId);
      Alert.alert('Succès', 'Utilisateur rétrogradé de transporteur');
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
      const updatedTransporters = await userService.getAllTransporters();
      setTransporters(updatedTransporters);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la rétrogradation');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleAssignTransporter = async (parcelId, transporterId, pickUpAdress, destinationAdress) => {
    try {
      setProcessingParcelId(parcelId);
      
      const parcelData = {
        transporterId: transporterId,
        pickUpAdress: pickUpAdress,           
        destinationAdress: destinationAdress, 
        adminId: user.id
      };
      
      console.log('Sending parcel update with data:', JSON.stringify(parcelData, null, 2));
      
      const result = await dispatch(updateParcel({ 
        id: parcelId, 
        parcelData: parcelData
      })).unwrap();
      
      console.log('Update successful:', result);
      
      Alert.alert('Succès', 'Transporteur assigné avec succès');
      await loadParcels();
      setAssignModalVisible(false);
      setPickUpAdress('');
      setDestinationAdress('');
      setSelectedParcelForAssign(null);
    } catch (error) {
      console.error('Error assigning transporter:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      Alert.alert('Erreur', 'Échec de l\'assignation');
    } finally {
      setProcessingParcelId(null);
    }
  };

  const handleDeliverParcel = async (parcelId) => {
    Alert.alert(
      'Livraison',
      'Confirmez-vous que ce colis a été livré ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setProcessingParcelId(parcelId);
              await dispatch(deliverParcel(parcelId)).unwrap();
              Alert.alert('Succès', 'Colis marqué comme livré');
              await loadParcels();
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la mise à jour');
            } finally {
              setProcessingParcelId(null);
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount) => {
    return `${amount?.toFixed(2) || '0.00'} TND`;
  };

  const toggleSidebar = () => {
    if (!isLargeScreen) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const renderSidebar = () => {
    const unreadCount = adminNotifications.filter(n => !n.read).length;
    const menuItems = [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'stats-chart-outline' },
      { id: 'users', label: 'Utilisateurs', icon: 'people-outline' },
      { id: 'auctions', label: 'Enchères', icon: 'hammer-outline' },
      { id: 'parcels', label: 'Colis', icon: 'cube-outline' },
      { id: 'transporters', label: 'Transporteurs', icon: 'car-outline' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
    ];

    if (!sidebarOpen && !isLargeScreen) return null;

    return (
      <View style={[
        styles.sidebar,
        !isLargeScreen && styles.sidebarMobile,
        !sidebarOpen && !isLargeScreen && styles.sidebarHidden
      ]}>
        <View style={styles.sidebarHeader}>
          <Ionicons name="hammer" size={32} color={Colors.primary} />
          <ThemedText style={styles.sidebarTitle}>S&D Admin</ThemedText>
          {!isLargeScreen && (
            <TouchableOpacity onPress={toggleSidebar} style={styles.closeSidebar}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView style={styles.sidebarMenu}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                activeMenu === item.id && styles.menuItemActive
              ]}
              onPress={() => {
                setActiveMenu(item.id);
                if (!isLargeScreen) setSidebarOpen(false);
              }}
            >
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={activeMenu === item.id ? Colors.primary : theme.iconColor} 
              />
              <ThemedText style={[
                styles.menuItemText,
                activeMenu === item.id && styles.menuItemTextActive
              ]}>
                {item.label}
              </ThemedText>
              {item.id === 'notifications' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDateFilter = () => (
    <View style={styles.filterSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterChips}>
          {[
            { id: 'day', label: 'Aujourd\'hui', icon: 'today-outline' },
            { id: 'week', label: '7 jours', icon: 'calendar-outline' },
            { id: 'month', label: '30 jours', icon: 'calendar-outline' },
            { id: 'year', label: '1 an', icon: 'calendar-outline' },
            { id: 'custom', label: 'Personnalisé', icon: 'options-outline' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                dateFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => setDateFilter(filter.id)}
            >
              <Ionicons 
                name={filter.icon} 
                size={14} 
                color={dateFilter === filter.id ? '#fff' : '#666'} 
              />
              <ThemedText style={[
                styles.filterChipText,
                dateFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {dateFilter === 'custom' && (
        <View style={styles.customDateContainer}>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <ThemedText style={styles.datePickerText}>
              Début: {customStartDate.toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <ThemedText style={styles.datePickerText}>
              Fin: {customEndDate.toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={customStartDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  setCustomStartDate(selectedDate);
                }
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={customEndDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  setCustomEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      )}
    </View>
  );

  const getAuctionChartData = () => {
    const total = auctionCounts.active + auctionCounts.pending + 
                  auctionCounts.denied + auctionCounts.ended;
    if (total === 0) return null;
    
    return [
      { name: 'Actives', population: auctionCounts.active, color: '#4ade80' },
      { name: 'En attente', population: auctionCounts.pending, color: '#fbbf24' },
      { name: 'Refusées', population: auctionCounts.denied, color: '#ef4444' },
      { name: 'Terminées', population: auctionCounts.ended, color: '#9ca3af' },
    ].filter(item => item.population > 0);
  };

  const renderDepositChart = () => {
    const depositByDate = {};
    filteredDeposits.forEach(deposit => {
      const date = new Date(deposit.createdAt || Date.now())
        .toLocaleDateString('fr-FR');
      if (!depositByDate[date]) depositByDate[date] = 0;
      depositByDate[date] += deposit.amount || 0;
    });

    const sortedDates = Object.keys(depositByDate)
      .sort((a, b) => new Date(a) - new Date(b));
    const last7Dates = sortedDates.slice(-7);
    const amounts = last7Dates.map(date => depositByDate[date] || 0);

    const chartData = {
      labels: last7Dates.map(date => date.substring(0, 5)),
      datasets: [{ data: amounts.length ? amounts : [0] }]
    };

    if (amounts.length === 0) {
      return (
        <ThemedCard style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>
            Évolution des dépôts
          </ThemedText>
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <ThemedText style={styles.noDataText}>
              Aucune donnée disponible
            </ThemedText>
          </View>
        </ThemedCard>
      );
    }

    return (
      <ThemedCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartTitle}>
            Évolution des dépôts
          </ThemedText>
          <ThemedText style={styles.chartSubtitle}>
            {dateFilter === 'day' ? 'Aujourd\'hui' :
             dateFilter === 'week' ? '7 derniers jours' :
             dateFilter === 'month' ? '30 derniers jours' :
             dateFilter === 'year' ? '12 derniers mois' : 
             'Période personnalisée'}
          </ThemedText>
        </View>
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={Math.min(screenWidth - 60, 350)}
            height={220}
            chartConfig={{
              backgroundColor: theme.cardBackground,
              backgroundGradientFrom: theme.cardBackground,
              backgroundGradientTo: theme.cardBackground,
              decimalPlaces: 2,
              color: (opacity = 1) => Colors.primary,
              labelColor: (opacity = 1) => theme.text,
              style: { borderRadius: 16 },
              propsForDots: { 
                r: '6', 
                strokeWidth: '2', 
                stroke: Colors.primary 
              },
            }}
            bezier
            style={styles.chart}
            formatYLabel={(value) => `${parseFloat(value).toFixed(0)} TND`}
          />
        </View>
      </ThemedCard>
    );
  };

  const renderDashboard = () => {
    const chartData = getAuctionChartData();
    
    return (
      <>
        <View style={styles.statsGrid}>
          <ThemedCard style={styles.statCard}>
            <View style={[
              styles.statIconContainer, 
              { backgroundColor: Colors.primary + '20' }
            ]}>
              <Ionicons name="people" size={24} color={Colors.primary} />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statValue}>
                {stats.totalUsers}
              </ThemedText>
              <ThemedText style={styles.statTitle}>
                Utilisateurs
              </ThemedText>
            </View>
          </ThemedCard>

          <ThemedCard style={styles.statCard}>
            <View style={[
              styles.statIconContainer, 
              { backgroundColor: '#3b82f6' + '20' }
            ]}>
              <Ionicons name="hammer" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statValue}>
                {stats.totalAuctions}
              </ThemedText>
              <ThemedText style={styles.statTitle}>
                Enchères
              </ThemedText>
            </View>
          </ThemedCard>
        </View>

        {chartData && chartData.length > 0 && (
          <ThemedCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartTitle}>
                Répartition des enchères
              </ThemedText>
              <ThemedText style={styles.chartSubtitle}>
                Total: {auctionCounts.active + auctionCounts.pending + 
                        auctionCounts.denied + auctionCounts.ended}
              </ThemedText>
            </View>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={chartData}
                width={Math.min(screenWidth - 60, 300)}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => theme.text,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
            <View style={styles.legendContainer}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[
                    styles.legendColor, 
                    { backgroundColor: item.color }
                  ]} />
                  <ThemedText style={styles.legendText}>
                    {item.name}: {item.population} (
                    {Math.round((item.population / 
                      (auctionCounts.active + auctionCounts.pending + 
                       auctionCounts.denied + auctionCounts.ended)) * 100)}%)
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedCard>
        )}

        <View style={styles.depositStatsRow}>
          <ThemedCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fbbf24' + '20' }]}>
              <Ionicons name="cash" size={24} color="#fbbf24" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statTitle}>Dépôts Total</ThemedText>
              <ThemedText style={styles.statValue}>{formatCurrency(stats.totalDeposits)}</ThemedText>
            </View>
          </ThemedCard>
        </View>

        <View style={styles.depositStatsRow}>
          <ThemedCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' + '20' }]}>
              <Ionicons name="hammer" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statTitle}>Dépôts Enchères</ThemedText>
              <ThemedText style={styles.statValue}>{formatCurrency(depositStats.auction)}</ThemedText>
            </View>
          </ThemedCard>

          <ThemedCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b' + '20' }]}>
              <Ionicons name="people" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statTitle}>Dépôts Enchères</ThemedText>
              <ThemedText style={styles.statValue}>{formatCurrency(depositStats.bids)}</ThemedText>
            </View>
          </ThemedCard>
        </View>

        {renderDateFilter()}
        {renderDepositChart()}

        <View style={styles.statsGrid}>
          <ThemedCard style={styles.statCard}>
            <View style={[
              styles.statIconContainer, 
              { backgroundColor: '#4ade80' + '20' }
            ]}>
              <Ionicons name="cube" size={24} color="#4ade80" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statValue}>
                {stats.totalParcels}
              </ThemedText>
              <ThemedText style={styles.statTitle}>
                Colis
              </ThemedText>
            </View>
          </ThemedCard>

          <ThemedCard style={styles.statCard}>
            <View style={[
              styles.statIconContainer, 
              { backgroundColor: '#f59e0b' + '20' }
            ]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statValue}>
                {stats.pendingParcels}
              </ThemedText>
              <ThemedText style={styles.statTitle}>
                En attente
              </ThemedText>
            </View>
          </ThemedCard>

          <ThemedCard style={styles.statCard}>
            <View style={[
              styles.statIconContainer, 
              { backgroundColor: '#22c55e' + '20' }
            ]}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statValue}>
                {stats.deliveredParcels}
              </ThemedText>
              <ThemedText style={styles.statTitle}>
                Livrés
              </ThemedText>
            </View>
          </ThemedCard>
        </View>
      </>
    );
  };

  const renderUsersList = () => (
    <ThemedCard style={styles.listCard}>
      <View style={styles.listHeader}>
        <ThemedText style={styles.listTitle}>
          Gestion des utilisateurs
        </ThemedText>
        <ThemedText style={styles.listCount}>
          {users.length} utilisateurs
        </ThemedText>
      </View>

      <View style={styles.tableHeader}>
        <ThemedText style={[styles.headerCell, { flex: 2 }]}>
          Utilisateur
        </ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>
          Rôle
        </ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>
          Statut
        </ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 2 }]}>
          Actions
        </ThemedText>
      </View>

      <ScrollView style={styles.tableBody}>
        {users.map((userItem, index) => (
          <View key={userItem.id} style={[
            styles.tableRow,
            index % 2 === 0 && { backgroundColor: theme.uiBackground + '40' }
          ]}>
            <View style={{ flex: 2 }}>
              <ThemedText style={styles.userName}>
                {userItem.firstname} {userItem.lastname}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {userItem.email}
              </ThemedText>
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={[
                styles.roleBadge,
                { backgroundColor: 
                  userItem.role === 'ADMIN' ? Colors.primary : 
                  userItem.role === 'Transporter' ? '#3b82f6' : '#666' 
                }
              ]}>
                <ThemedText style={styles.roleText}>
                  {userItem.role}
                </ThemedText>
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: 
                  userItem.status === 'Activated' ? '#4ade80' : 
                  userItem.status === 'Blocked' ? '#ef4444' : '#fbbf24' 
                }
              ]}>
                <ThemedText style={styles.statusText}>
                  {userItem.status}
                </ThemedText>
              </View>
            </View>

            <View style={{ 
              flex: 2, 
              flexDirection: 'row', 
              gap: 8, 
              flexWrap: 'wrap' 
            }}>
              {userItem.status !== 'Blocked' ? (
                <TouchableOpacity
                  onPress={() => handleBlockUser(userItem.id)}
                  disabled={processingUserId === userItem.id || blockLoading}
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                >
                  {(processingUserId === userItem.id && blockLoading) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleUnblockUser(userItem.id)}
                  disabled={processingUserId === userItem.id || unblockLoading}
                  style={[styles.actionButton, { backgroundColor: '#4ade80' }]}
                >
                  {(processingUserId === userItem.id && unblockLoading) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="lock-open" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
              
              {userItem.role !== 'ADMIN' && userItem.role !== 'Transporter' && (
                <TouchableOpacity
                  onPress={() => handleRoleChange(userItem.id, userItem.role)}
                  disabled={processingUserId === userItem.id}
                  style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                >
                  {processingUserId === userItem.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="shield" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}

              {userItem.role === 'ADMIN' && (
                <TouchableOpacity
                  onPress={() => handleRoleChange(userItem.id, userItem.role)}
                  disabled={processingUserId === userItem.id}
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                >
                  {processingUserId === userItem.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="person" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}

              {userItem.role !== 'Transporter' && userItem.role !== 'ADMIN' && (
                <TouchableOpacity
                  onPress={() => handleMakeTransporter(userItem.id)}
                  disabled={processingUserId === userItem.id}
                  style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                >
                  {processingUserId === userItem.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="car" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}

              {userItem.role === 'Transporter' && (
                <TouchableOpacity
                  onPress={() => handleRemoveTransporter(userItem.id)}
                  disabled={processingUserId === userItem.id}
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                >
                  {processingUserId === userItem.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="person" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedCard>
  );

  const renderAuctionsList = () => {
    const filteredAuctions = auctions.filter(auction => {
      if (auctionFilter === 'all') return true;
      if (auctionFilter === 'pending') return auction.status === 'pending';
      if (auctionFilter === 'active') return auction.status === 'active';
      if (auctionFilter === 'denied') return auction.status === 'denied';
      if (auctionFilter === 'ended') return auction.status === 'ended';
      return true;
    });

    return (
      <View>
        <View style={styles.auctionFilters}>
          {['all', 'pending', 'active', 'denied', 'ended'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.auctionFilterChip,
                auctionFilter === filter && styles.auctionFilterChipActive
              ]}
              onPress={() => setAuctionFilter(filter)}
            >
              <Ionicons 
                name={filter === 'all' ? 'apps' : 
                      filter === 'active' ? 'play-circle' :
                      filter === 'pending' ? 'time' :
                      filter === 'denied' ? 'close-circle' : 'stop-circle'} 
                size={14} 
                color={auctionFilter === filter ? '#fff' : '#666'} 
              />
              <ThemedText style={[
                styles.auctionFilterText,
                auctionFilter === filter && styles.auctionFilterTextActive
              ]}>
                {filter === 'all' ? 'Toutes' : 
                 filter === 'active' ? 'Actives' :
                 filter === 'pending' ? 'En attente' :
                 filter === 'denied' ? 'Refusées' : 'Terminées'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {filteredAuctions.map(auction => (
          <TouchableOpacity 
            key={auction.id} 
            onPress={() => handleAuctionPress(auction)}
          >
            <View style={styles.auctionItemCard}>
              <View style={styles.auctionItemHeader}>
                <View style={styles.auctionTitleContainer}>
                  <Ionicons name="hammer" size={20} color={Colors.primary} />
                  <ThemedText style={styles.auctionItemTitle}>
                    {auction.title}
                  </ThemedText>
                </View>
                <View style={[
                  styles.statusBadgeSmall,
                  { backgroundColor: 
                    auction.status === 'active' ? '#4ade80' :
                    auction.status === 'pending' ? '#fbbf24' :
                    auction.status === 'denied' ? '#ef4444' : 
                    auction.status === 'ended' ? '#9ca3af' : '#666' 
                  }
                ]}>
                  <ThemedText style={styles.statusBadgeTextSmall}>
                    {auction.status === 'active' ? 'Active' :
                     auction.status === 'pending' ? 'En attente' :
                     auction.status === 'denied' ? 'Refusée' :
                     auction.status === 'ended' ? 'Terminée' : auction.status}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.auctionItemDetails}>
                <View style={styles.detailChip}>
                  <Ionicons name="person-outline" size={14} color="#666" />
                  <ThemedText style={styles.detailChipText}>
                    {getUserName(auction.sellerId)}
                  </ThemedText>
                </View>
                
                <View style={styles.detailChip}>
                  <Ionicons name="cash-outline" size={14} color="#666" />
                  <ThemedText style={styles.detailChipText}>
                    {auction.startingPrice} TND
                  </ThemedText>
                </View>
                
                <View style={styles.detailChip}>
                  <Ionicons name="people-outline" size={14} color="#666" />
                  <ThemedText style={styles.detailChipText}>
                    {auction.bidders ? Object.keys(auction.bidders).length : 0} 
                    enchérisseurs
                  </ThemedText>
                </View>
              </View>

              {auction.status === 'pending' && (
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.actionChip, styles.approveChip]}
                    onPress={() => handleApproveAuction(auction.id)}
                    disabled={processingAuctionId === auction.id}
                  >
                    {processingAuctionId === auction.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <ThemedText style={styles.actionChipText}>
                          Approuver
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionChip, styles.denyChip]}
                    onPress={() => handleDenyAuction(auction.id)}
                    disabled={processingAuctionId === auction.id}
                  >
                    {processingAuctionId === auction.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close" size={16} color="#fff" />
                        <ThemedText style={styles.actionChipText}>
                          Refuser
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderParcelsList = () => {
    const filteredParcels = adminParcelsList.filter(parcel => {
      if (parcelFilter === 'all') return true;
      if (parcelFilter === 'pending') return !parcel.delivred && !parcel.transporterId;
      if (parcelFilter === 'assigned') return parcel.transporterId && !parcel.delivred;
      if (parcelFilter === 'delivered') return parcel.delivred;
      return true;
    });

    return (
      <View>
        <View style={styles.auctionFilters}>
          {['all', 'pending', 'assigned', 'delivered'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.auctionFilterChip,
                parcelFilter === filter && styles.auctionFilterChipActive
              ]}
              onPress={() => setParcelFilter(filter)}
            >
              <Ionicons 
                name={filter === 'all' ? 'apps' : 
                      filter === 'pending' ? 'time' :
                      filter === 'assigned' ? 'car' : 'checkmark-circle'} 
                size={14} 
                color={parcelFilter === filter ? '#fff' : '#666'} 
              />
              <ThemedText style={[
                styles.auctionFilterText,
                parcelFilter === filter && styles.auctionFilterTextActive
              ]}>
                {filter === 'all' ? 'Tous' : 
                 filter === 'pending' ? 'En attente' :
                 filter === 'assigned' ? 'Assignés' : 'Livrés'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {filteredParcels.map(parcel => (
          <View key={parcel.id} style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <View style={styles.parcelInfo}>
                <Ionicons name="cube" size={20} color={Colors.primary} />
                <ThemedText style={styles.parcelId}>
                  Colis #{parcel.id.substring(0, 8)}
                </ThemedText>
              </View>
              <View style={[
                styles.parcelStatus,
                { backgroundColor: 
                  parcel.delivred ? '#4ade80' : 
                  parcel.transporterId ? '#3b82f6' : '#fbbf24' 
                }
              ]}>
                <ThemedText style={styles.parcelStatusText}>
                  {parcel.delivred ? 'Livré' : 
                   parcel.transporterId ? 'En cours' : 'En attente'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.parcelDetails}>
              <View style={styles.parcelDetailRow}>
                <Ionicons name="hammer" size={14} color="#666" />
                <ThemedText style={styles.parcelDetailText}>
                  Enchère: {getUserName(parcel.auctionId)}
                </ThemedText>
              </View>
              
              <View style={styles.parcelDetailRow}>
                <Ionicons name="person" size={14} color="#666" />
                <ThemedText style={styles.parcelDetailText}>
                  Acheteur: {getUserName(parcel.buyerId)}
                </ThemedText>
              </View>
              
              <View style={styles.parcelDetailRow}>
                <Ionicons name="car" size={14} color="#666" />
                <ThemedText style={styles.parcelDetailText}>
                  Transporteur: {parcel.transporterId ? 
                    getUserName(parcel.transporterId) : 'Non assigné'}
                </ThemedText>
              </View>
            </View>

            {!parcel.delivred && (
              <View style={styles.parcelActions}>
                {!parcel.transporterId && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => {
                      setSelectedParcelForAssign(parcel);
                      setAssignModalVisible(true);
                    }}
                    disabled={processingParcelId === parcel.id}
                  >
                    {processingParcelId === parcel.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="car" size={16} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>
                          Assigner
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {parcel.transporterId && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deliverButton]}
                    onPress={() => handleDeliverParcel(parcel.id)}
                    disabled={processingParcelId === parcel.id}
                  >
                    {processingParcelId === parcel.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>
                          Marquer livré
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {parcel.delivred && parcel.isValid !== null && (
              <View style={styles.qualityInfo}>
                <Ionicons 
                  name={parcel.isValid ? "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={parcel.isValid ? "#4ade80" : "#ef4444"} 
                />
                <ThemedText style={[
                  styles.qualityText,
                  { color: parcel.isValid ? "#4ade80" : "#ef4444" }
                ]}>
                  {parcel.isValid ? 'Produit conforme' : 'Produit non conforme'}
                </ThemedText>
                {!parcel.isValid && parcel.unvalidDescription && (
                  <ThemedText style={styles.qualityDescription}>
                    Motif: {parcel.unvalidDescription}
                  </ThemedText>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderTransportersList = () => (
    <ThemedCard style={styles.listCard}>
      <View style={styles.listHeader}>
        <ThemedText style={styles.listTitle}>
          Gestion des transporteurs
        </ThemedText>
        <ThemedText style={styles.listCount}>
          {transporters.length} transporteurs
        </ThemedText>
      </View>

      <View style={styles.tableHeader}>
        <ThemedText style={[styles.headerCell, { flex: 2 }]}>
          Transporteur
        </ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>
          Statut
        </ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>
          Actions
        </ThemedText>
      </View>

      <ScrollView style={styles.tableBody}>
        {transporters.map((transporter, index) => (
          <View key={transporter.id} style={[
            styles.tableRow,
            index % 2 === 0 && { backgroundColor: theme.uiBackground + '40' }
          ]}>
            <View style={{ flex: 2 }}>
              <ThemedText style={styles.userName}>
                {transporter.firstname} {transporter.lastname}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {transporter.email}
              </ThemedText>
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: 
                  transporter.status === 'Activated' ? '#4ade80' : '#fbbf24' 
                }
              ]}>
                <ThemedText style={styles.statusText}>
                  {transporter.status}
                </ThemedText>
              </View>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleRemoveTransporter(transporter.id)}
                disabled={processingUserId === transporter.id}
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              >
                {processingUserId === transporter.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="person" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedCard>
  );

  const renderNotificationsList = () => {
    const unreadNotifications = adminNotifications.filter(n => !n.read);
    
    return (
      <ThemedCard style={styles.listCard}>
        <View style={styles.listHeader}>
          <ThemedText style={styles.listTitle}>
            Notifications
          </ThemedText>
          <View style={styles.listHeaderRight}>
            {unreadNotifications.length > 0 && !notificationSelectionMode && (
              <TouchableOpacity onPress={() => setNotificationSelectionMode(true)}>
                <ThemedText style={styles.selectText}>
                  Sélectionner
                </ThemedText>
              </TouchableOpacity>
            )}
            {notificationSelectionMode && (
              <View style={styles.selectionActions}>
                <TouchableOpacity onPress={handleSelectAllNotifications}>
                  <ThemedText style={styles.selectText}>
                    {selectedNotificationIds.length === adminNotifications.length 
                      ? 'Tout désélectionner' 
                      : 'Tout sélectionner'}
                  </ThemedText>
                </TouchableOpacity>
                {selectedNotificationIds.length > 0 && (
                  <TouchableOpacity onPress={handleMarkSelectedAsRead}>
                    <ThemedText style={[styles.selectText, { color: Colors.primary }]}>
                      Marquer lues ({selectedNotificationIds.length})
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  setNotificationSelectionMode(false);
                  setSelectedNotificationIds([]);
                }}>
                  <ThemedText style={styles.selectText}>
                    Annuler
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.tableBody}>
          {adminNotifications.length === 0 ? (
            <View style={styles.noNotificationsContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
              <ThemedText style={styles.noNotificationsText}>
                Aucune notification
              </ThemedText>
            </View>
          ) : (
            adminNotifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationRow,
                  !notification.read && styles.unreadNotificationRow,
                  notificationSelectionMode && 
                    selectedNotificationIds.includes(notification.id) && 
                    styles.selectedNotificationRow
                ]}
                onPress={() => handleNotificationPress(notification)}
                onLongPress={() => handleLongPressNotification(notification.id)}
                delayLongPress={300}
              >
                <View style={styles.notificationIcon}>
                  {notification.type === 'AUCTION_PENDING' ? (
                    <Ionicons name="hammer" size={24} color="#fbbf24" />
                  ) : (
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                  )}
                </View>
                <View style={styles.notificationContent}>
                  <ThemedText style={[
                    styles.notificationMessage,
                    !notification.read && styles.unreadNotificationMessage
                  ]}>
                    {notification.message}
                  </ThemedText>
                  <ThemedText style={styles.notificationDate}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </ThemedText>
                </View>
                {!notification.read && !notificationSelectionMode && 
                  <View style={styles.unreadDot} />
                }
                {notificationSelectionMode && (
                  <Ionicons
                    name={selectedNotificationIds.includes(notification.id) 
                      ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selectedNotificationIds.includes(notification.id) 
                      ? Colors.primary : '#ccc'}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ThemedCard>
    );
  };

  const renderAssignModal = () => (
    <Modal
      visible={assignModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setAssignModalVisible(false);
        setPickUpAdress('');
        setDestinationAdress('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Assigner un transporteur
            </ThemedText>
            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            <ThemedText style={styles.modalLabel}>Adresse de collecte:</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="Entrez l'adresse de collecte"
              value={pickUpAdress}
              onChangeText={setPickUpAdress}
              multiline
              numberOfLines={2}
            />
            
            <ThemedText style={styles.modalLabel}>Adresse de destination:</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="Entrez l'adresse de destination"
              value={destinationAdress}
              onChangeText={setDestinationAdress}
              multiline
              numberOfLines={2}
            />
            
            <ThemedText style={styles.modalLabel}>Sélectionnez un transporteur:</ThemedText>
            {transporters.length === 0 ? (
              <ThemedText style={styles.noTransportersText}>
                Aucun transporteur disponible
              </ThemedText>
            ) : (
              transporters.map(transporter => (
                <TouchableOpacity
                  key={transporter.id}
                  style={styles.modalListItem}
                  onPress={() => {
                    if (!pickUpAdress.trim()) {
                      Alert.alert('Erreur', 'Veuillez entrer l\'adresse de collecte');
                      return;
                    }
                    if (!destinationAdress.trim()) {
                      Alert.alert('Erreur', 'Veuillez entrer l\'adresse de destination');
                      return;
                    }
                    handleAssignTransporter(
                      selectedParcelForAssign?.id, 
                      transporter.id,
                      pickUpAdress,
                      destinationAdress
                    );
                  }}
                >
                  <View style={styles.modalListItemContent}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                    <View style={styles.modalListItemInfo}>
                      <ThemedText style={styles.modalListItemName}>
                        {transporter.firstname} {transporter.lastname}
                      </ThemedText>
                      <ThemedText style={styles.modalListItemEmail}>
                        {transporter.email}
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAuctionDetails = () => (
    <Modal
      visible={auctionModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setAuctionModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Détails de l'enchère
            </ThemedText>
            <TouchableOpacity onPress={() => setAuctionModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedAuction && (
            <ScrollView>
              {auctionPhotos.length > 0 && (
                <View style={styles.photoStrip}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.photoContainer}>
                      {auctionPhotos.map((photo, index) => (
                        <Image 
                          key={index}
                          source={{ uri: photo }}
                          style={styles.tinyPhoto}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <ThemedCard style={styles.modalAuctionCard}>
                <ThemedText style={styles.modalAuctionTitle}>
                  {selectedAuction.title}
                </ThemedText>
                
                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="document-text" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    {selectedAuction.description}
                  </ThemedText>
                </View>

                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="person" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    Vendeur: {getUserName(selectedAuction.sellerId)}
                  </ThemedText>
                </View>

                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="cash" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    Prix de départ: {selectedAuction.startingPrice} TND
                  </ThemedText>
                </View>

                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    Expire le: {new Date(selectedAuction.expireDate)
                      .toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>
              </ThemedCard>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderBlockModal = () => (
    <Modal
      visible={blockModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => !blockLoading && setBlockModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Bloquer l'utilisateur
            </ThemedText>
            <TouchableOpacity 
              onPress={() => !blockLoading && setBlockModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <ThemedText style={styles.modalLabel}>
              Nombre de jours de blocage:
            </ThemedText>
            
            <View style={styles.daysPicker}>
              {[1, 3, 7, 14, 30].map(days => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.dayButton,
                    parseInt(blockDays) === days && styles.dayButtonActive
                  ]}
                  onPress={() => setBlockDays(days.toString())}
                  disabled={blockLoading}
                >
                  <ThemedText style={[
                    styles.dayButtonText,
                    parseInt(blockDays) === days && styles.dayButtonTextActive
                  ]}>
                    {days} jour{days > 1 ? 's' : ''}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setBlockModalVisible(false)}
                disabled={blockLoading}
              >
                <ThemedText style={styles.cancelModalButtonText}>
                  Annuler
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmBlockUser}
                disabled={blockLoading}
              >
                {blockLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.confirmModalButtonText}>
                    Bloquer
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing && activeMenu === 'dashboard') {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.mainLayout}>
        {renderSidebar()}
        
        <View style={[
          styles.mainContent, 
          !sidebarOpen && isLargeScreen && styles.mainContentFull
        ]}>
          <View style={[
            styles.contentHeader, 
            { backgroundColor: theme.navBackground }
          ]}>
            {!isLargeScreen && (
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <Ionicons name="menu" size={24} color={theme.iconColorFocused} />
              </TouchableOpacity>
            )}
            <ThemedText style={styles.contentHeaderTitle}>
              {activeMenu === 'dashboard' && 'Tableau de bord'}
              {activeMenu === 'users' && 'Gestion des utilisateurs'}
              {activeMenu === 'auctions' && 'Gestion des enchères'}
              {activeMenu === 'parcels' && 'Gestion des colis'}
              {activeMenu === 'transporters' && 'Gestion des transporteurs'}
              {activeMenu === 'notifications' && 'Notifications'}
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <ScrollView 
            style={styles.contentScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.contentInner}>
              {activeMenu === 'dashboard' && renderDashboard()}
              {activeMenu === 'users' && renderUsersList()}
              {activeMenu === 'auctions' && renderAuctionsList()}
              {activeMenu === 'parcels' && renderParcelsList()}
              {activeMenu === 'transporters' && renderTransportersList()}
              {activeMenu === 'notifications' && renderNotificationsList()}
            </View>
          </ScrollView>
        </View>
      </View>

      {renderAuctionDetails()}
      {renderBlockModal()}
      {renderAssignModal()}
    </ThemedView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  mainLayout: { 
    flex: 1, 
    flexDirection: 'row' 
  },
  sidebar: { 
    width: 280, 
    backgroundColor: '#1e1a2e', 
    borderRightWidth: 1, 
    borderRightColor: '#2d2a3e' 
  },
  sidebarMobile: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    zIndex: 1000, 
    width: 280, 
    shadowColor: '#000', 
    shadowOffset: { width: 2, height: 0 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    elevation: 5 
  },
  sidebarHidden: { 
    display: 'none' 
  },
  sidebarHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2d2a3e', 
    gap: 12 
  },
  sidebarTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff', 
    flex: 1 
  },
  closeSidebar: { 
    padding: 5 
  },
  sidebarMenu: { 
    flex: 1, 
    paddingTop: 10 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    marginHorizontal: 10, 
    marginVertical: 4, 
    borderRadius: 12, 
    gap: 12 
  },
  menuItemActive: { 
    backgroundColor: Colors.primary + '20' 
  },
  menuItemText: { 
    fontSize: 16, 
    flex: 1 
  },
  menuItemTextActive: { 
    color: Colors.primary, 
    fontWeight: '600' 
  },
  badge: { 
    backgroundColor: Colors.warning, 
    borderRadius: 10, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  badgeText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  mainContent: { 
    flex: 1 
  },
  mainContentFull: { 
    marginLeft: 0 
  },
  contentHeader: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  menuButton: { 
    padding: 8, 
    marginRight: 15 
  },
  contentHeaderTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    flex: 1 
  },
  headerRight: { 
    width: 40 
  },
  contentScroll: { 
    flex: 1 
  },
  contentInner: { 
    padding: 20 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: Colors.primary 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 15, 
    gap: 10 
  },
  statCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12 
  },
  statIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  statInfo: { 
    flex: 1 
  },
  statValue: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  statTitle: { 
    fontSize: 11, 
    opacity: 0.7 
  },
  depositStatsRow: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    gap: 10 
  },
  filterSection: { 
    marginBottom: 15 
  },
  filterChips: { 
    flexDirection: 'row', 
    gap: 8, 
    paddingVertical: 5 
  },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: '#f0f0f0', 
    gap: 4 
  },
  filterChipActive: { 
    backgroundColor: Colors.primary 
  },
  filterChipText: { 
    fontSize: 12, 
    color: '#666' 
  },
  filterChipTextActive: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  customDateContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    gap: 10 
  },
  datePickerButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8, 
    gap: 6 
  },
  datePickerText: { 
    fontSize: 12, 
    color: '#333' 
  },
  chartCard: { 
    padding: 15, 
    marginBottom: 15 
  },
  chartHeader: { 
    marginBottom: 15 
  },
  chartTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  chartSubtitle: { 
    fontSize: 12, 
    opacity: 0.6, 
    marginTop: 4 
  },
  chartWrapper: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  chart: { 
    borderRadius: 16 
  },
  pieChartContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 10 
  },
  legendContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    marginTop: 15, 
    gap: 12 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  legendColor: { 
    width: 12, 
    height: 12, 
    borderRadius: 6 
  },
  legendText: { 
    fontSize: 12 
  },
  noDataContainer: { 
    alignItems: 'center', 
    padding: 40 
  },
  noDataText: { 
    marginTop: 10, 
    fontSize: 14, 
    opacity: 0.6 
  },
  listCard: { 
    padding: 15 
  },
  listHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  listHeaderRight: { 
    flexDirection: 'row', 
    gap: 12 
  },
  listTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  listCount: { 
    fontSize: 13, 
    opacity: 0.7 
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: 10, 
    paddingHorizontal: 10, 
    borderBottomWidth: 2, 
    borderBottomColor: '#e0e0e0', 
    backgroundColor: '#f5f5f5' 
  },
  headerCell: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#666', 
    textTransform: 'uppercase' 
  },
  tableBody: { 
    maxHeight: 500 
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  userName: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 2 
  },
  userEmail: { 
    fontSize: 12, 
    opacity: 0.7 
  },
  roleBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  roleText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  statusBadgeSmall: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12 
  },
  statusBadgeTextSmall: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: '600' 
  },
  statusText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  actionButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  auctionFilters: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    gap: 8, 
    flexWrap: 'wrap' 
  },
  auctionFilterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: '#f0f0f0', 
    gap: 4 
  },
  auctionFilterChipActive: { 
    backgroundColor: Colors.primary 
  },
  auctionFilterText: { 
    fontSize: 12, 
    color: '#666' 
  },
  auctionFilterTextActive: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  auctionItemCard: { 
    marginBottom: 10, 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f0f0f0', 
    shadowOpacity: 0 
  },
  auctionItemHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  auctionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  auctionItemTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    flex: 1 
  },
  auctionItemDetails: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 8 
  },
  detailChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 16, 
    gap: 4 
  },
  detailChipText: { 
    fontSize: 11, 
    color: '#666' 
  },
  adminActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 10, 
    marginTop: 10, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  actionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8, 
    gap: 6 
  },
  approveChip: { 
    backgroundColor: '#4ade80' 
  },
  denyChip: { 
    backgroundColor: '#ef4444' 
  },
  actionChipText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  parcelCard: { 
    marginBottom: 10, 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f0f0f0' 
  },
  parcelHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  parcelInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  parcelId: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  parcelStatus: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  parcelStatusText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  parcelDetails: { 
    marginTop: 8, 
    gap: 6 
  },
  parcelDetailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  parcelDetailText: { 
    fontSize: 12, 
    color: '#666' 
  },
  parcelActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 10, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  assignButton: { 
    backgroundColor: '#3b82f6' 
  },
  deliverButton: { 
    backgroundColor: '#4ade80' 
  },
  actionButtonText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600', 
    marginLeft: 6 
  },
  qualityInfo: { 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    flexWrap: 'wrap' 
  },
  qualityText: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  qualityDescription: { 
    fontSize: 11, 
    color: '#666', 
    width: '100%', 
    marginTop: 4 
  },
  notificationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  unreadNotificationRow: { 
    backgroundColor: '#f8f9fa' 
  },
  selectedNotificationRow: { 
    backgroundColor: Colors.primary + '10' 
  },
  notificationIcon: { 
    width: 40, 
    alignItems: 'center' 
  },
  notificationContent: { 
    flex: 1, 
    marginLeft: 8 
  },
  notificationMessage: { 
    fontSize: 14, 
    marginBottom: 4 
  },
  unreadNotificationMessage: { 
    fontWeight: '700' 
  },
  notificationDate: { 
    fontSize: 11, 
    opacity: 0.6 
  },
  unreadDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: Colors.primary, 
    marginLeft: 10 
  },
  selectText: { 
    fontSize: 12, 
    color: Colors.primary, 
    fontWeight: '600' 
  },
  selectionActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  noNotificationsContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 40 
  },
  noNotificationsText: { 
    fontSize: 16, 
    opacity: 0.6, 
    marginTop: 12 
  },
  daysPicker: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginVertical: 15 
  },
  dayButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0' 
  },
  dayButtonActive: { 
    backgroundColor: Colors.primary 
  },
  dayButtonText: { 
    fontSize: 14, 
    color: '#666' 
  },
  dayButtonTextActive: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    width: '90%', 
    maxWidth: 500, 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  modalBody: { 
    gap: 15 
  },
  modalLabel: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  modalActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 10 
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  noTransportersText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  cancelModalButton: { 
    backgroundColor: '#f0f0f0' 
  },
  cancelModalButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#666' 
  },
  confirmModalButton: { 
    backgroundColor: Colors.primary 
  },
  confirmModalButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff' 
  },
  modalList: { 
    maxHeight: 400 
  },
  modalListItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  modalListItemContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  modalListItemInfo: { 
    flex: 1 
  },
  modalListItemName: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  modalListItemEmail: { 
    fontSize: 12, 
    opacity: 0.7 
  },
  photoStrip: { 
    marginBottom: 15 
  },
  photoContainer: { 
    flexDirection: 'row', 
    gap: 8, 
    paddingVertical: 5 
  },
  tinyPhoto: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e0e0e0' 
  },
  modalAuctionCard: { 
    padding: 15 
  },
  modalAuctionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 10 
  },
  modalAuctionDetail: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 5, 
    gap: 8 
  },
  modalAuctionDetailText: { 
    fontSize: 13, 
    flex: 1 
  }
});