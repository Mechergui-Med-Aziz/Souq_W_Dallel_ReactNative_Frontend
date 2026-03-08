// app/(admin)/index.jsx - Cleaned Version
import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAllAuctions } from '../../store/slices/auctionSlice';
import { userService } from '../../store/services/userService';
import { auctionService } from '../../store/services/auctionService';
import { depositService } from '../../store/services/depositService';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

const AdminDashboard = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { auctions, loading } = useAppSelector((state) => state.auction);
  
  // Data state
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerNames, setSellerNames] = useState({});
  
  // Modal state
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [auctionPhotos, setAuctionPhotos] = useState([]);
  const [auctionModalVisible, setAuctionModalVisible] = useState(false);
  
  // Filter state
  const [dateFilter, setDateFilter] = useState('week');
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [auctionFilter, setAuctionFilter] = useState('all');
  const [processingUserId, setProcessingUserId] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAuctions: 0,
    totalDeposits: 0,
    totalNotifications: 0,
    activeAuctions: 0,
    endedAuctions: 0,
    pendingAuctions: 0,
    totalBids: 0,
    auctionDeposits: 0,
    bidDeposits: 0
  });

  // Chart data
  const [depositChartData, setDepositChartData] = useState({
    labels: ['Aucune donnée'],
    datasets: [{ data: [0] }]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (deposits.length > 0) {
      filterDepositsByDate();
    }
  }, [deposits, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    // Load seller names for auctions
    const loadSellerNames = async () => {
      const names = {};
      for (const auction of auctions) {
        if (auction.sellerId && !names[auction.sellerId]) {
          try {
            const seller = await userService.getUserById(auction.sellerId);
            names[auction.sellerId] = seller ? 
              `${seller.firstname || ''} ${seller.lastname || ''}`.trim() || seller.email : 
              'Inconnu';
          } catch (error) {
            names[auction.sellerId] = 'Inconnu';
          }
        }
      }
      setSellerNames(names);
    };
    
    if (auctions.length > 0) {
      loadSellerNames();
    }
  }, [auctions]);

  const loadDashboardData = async () => {
    try {
      // Load auctions
      await dispatch(fetchAllAuctions()).unwrap();
      
      // Load users
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      
      // Load deposits
      const depositsData = await depositService.getAllDeposits();
      setDeposits(depositsData);
      setFilteredDeposits(depositsData);
      
      calculateStats(usersData, auctions, depositsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }
  };

  const filterDepositsByDate = () => {
    if (!deposits.length) {
      setFilteredDeposits([]);
      setDepositChartData({
        labels: ['Aucune donnée'],
        datasets: [{ data: [0] }]
      });
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
      return depositDate >= startDate && depositDate <= endDate;
    });

    setFilteredDeposits(filtered);
    updateDepositChartData(filtered);
  };

  const updateDepositChartData = (filteredDeposits) => {
    if (!filteredDeposits.length) {
      setDepositChartData({
        labels: ['Aucune donnée'],
        datasets: [{ data: [0] }]
      });
      return;
    }

    // Group by date
    const groupedByDate = {};
    filteredDeposits.forEach(deposit => {
      const date = new Date(deposit.createdAt || Date.now()).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += deposit.amount || 0;
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      new Date(a) - new Date(b)
    );

    // Take last 7 days or all if less
    const labels = sortedDates.length > 7 ? sortedDates.slice(-7) : sortedDates;
    const data = labels.map(date => groupedByDate[date] || 0);

    setDepositChartData({
      labels,
      datasets: [{ data }]
    });
  };

  const calculateStats = (usersData, auctionsData, depositsData) => {
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
    
    const totalBids = auctionsData.reduce((sum, auction) => 
      sum + (auction.bidders ? Object.keys(auction.bidders).length : 0), 0
    );
    
    const auctionDepositsTotal = depositsData
      .filter(d => d.type === 'auction')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const bidDepositsTotal = depositsData
      .filter(d => d.type === 'bids')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const totalDepositAmount = auctionDepositsTotal + bidDepositsTotal;
    
    setStats({
      totalUsers: usersData.length,
      totalAuctions: auctionsData.length,
      totalDeposits: totalDepositAmount,
      totalNotifications: 0,
      activeAuctions,
      endedAuctions,
      pendingAuctions,
      totalBids,
      auctionDeposits: auctionDepositsTotal,
      bidDeposits: bidDepositsTotal
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleAuctionPress = async (auction) => {
    try {
      // Load auction photos
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

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      setProcessingUserId(userId);
      if (currentStatus === 'Blocked') {
        await userService.unblockUser(userId);
        Alert.alert('Succès', 'Utilisateur débloqué avec succès');
      } else {
        await userService.blockUser(userId);
        Alert.alert('Succès', 'Utilisateur bloqué avec succès');
      }
      // Refresh user list
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'opération');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    try {
      setProcessingUserId(userId);
      if (currentRole === 'ADMIN') {
        // Demote to USER
        await userService.makeUser(userId);
        Alert.alert('Succès', 'Utilisateur rétrogradé en utilisateur standard');
      } else {
        // Promote to ADMIN
        await userService.makeAdmin(userId);
        Alert.alert('Succès', 'Utilisateur promu administrateur');
      }
      // Refresh user list
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la modification du rôle');
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount?.toFixed(2) || '0.00'} TND`;
  };

  const getSellerName = (sellerId) => {
    return sellerNames[sellerId] || 'Chargement...';
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

  const renderStatsCards = () => (
    <View style={styles.statsGrid}>
      <ThemedCard style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '20' }]}>
          <Ionicons name="people" size={24} color={Colors.primary} />
        </View>
        <View style={styles.statInfo}>
          <ThemedText style={styles.statValue}>{stats.totalUsers}</ThemedText>
          <ThemedText style={styles.statTitle}>Utilisateurs</ThemedText>
        </View>
      </ThemedCard>

      <ThemedCard style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' + '20' }]}>
          <Ionicons name="hammer" size={24} color="#3b82f6" />
        </View>
        <View style={styles.statInfo}>
          <ThemedText style={styles.statValue}>{stats.totalAuctions}</ThemedText>
          <ThemedText style={styles.statTitle}>Enchères</ThemedText>
        </View>
      </ThemedCard>
    </View>
  );

  const renderDepositStats = () => (
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

      <ThemedCard style={styles.depositStatCard}>
        <View style={styles.depositStatHeader}>
          <Ionicons name="trending-up" size={20} color="#3b82f6" />
          <ThemedText style={styles.depositStatTitle}>Dépôts enchères</ThemedText>
        </View>
        <ThemedText style={styles.depositStatValue}>{formatCurrency(stats.bidDeposits)}</ThemedText>
      </ThemedCard>
    </View>
  );

  const renderCharts = () => {
    const hasAuctionData = stats.activeAuctions > 0 || stats.endedAuctions > 0 || stats.pendingAuctions > 0;
    const hasDepositData = depositChartData.datasets[0]?.data?.length > 0 && 
                          depositChartData.datasets[0].data[0] > 0;

    return (
      <View style={styles.chartsContainer}>
        {hasAuctionData && (
          <ThemedCard style={styles.chartCard}>
            <ThemedText style={styles.chartTitle}>Répartition des enchères</ThemedText>
            <View style={styles.chartWrapper}>
              <PieChart
                data={[
                  {
                    name: 'Actives',
                    population: stats.activeAuctions || 0,
                    color: '#4ade80',
                    legendFontColor: theme.text,
                    legendFontSize: 12
                  },
                  {
                    name: 'Terminées',
                    population: stats.endedAuctions || 0,
                    color: '#ef4444',
                    legendFontColor: theme.text,
                    legendFontSize: 12
                  },
                  {
                    name: 'En attente',
                    population: stats.pendingAuctions || 0,
                    color: '#fbbf24',
                    legendFontColor: theme.text,
                    legendFontSize: 12
                  }
                ].filter(item => item.population > 0)}
                width={Math.min(screenWidth - 60, 300)}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </ThemedCard>
        )}

        {hasDepositData && (
          <ThemedCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartTitle}>Évolution des dépôts</ThemedText>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                  <ThemedText style={styles.legendText}>Montant (TND)</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <BarChart
                data={depositChartData}
                width={Math.min(screenWidth - 60, 350)}
                height={180}
                chartConfig={{
                  backgroundColor: Colors.primary,
                  backgroundGradientFrom: Colors.primary,
                  backgroundGradientTo: '#764ba2',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </ThemedCard>
        )}
      </View>
    );
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
        onPress={() => setActiveTab('overview')}
      >
        <Ionicons 
          name="bar-chart-outline" 
          size={18} 
          color={activeTab === 'overview' ? '#fff' : theme.iconColor} 
        />
        <ThemedText style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
          Aperçu
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
        onPress={() => setActiveTab('users')}
      >
        <Ionicons 
          name="people-outline" 
          size={18} 
          color={activeTab === 'users' ? '#fff' : theme.iconColor} 
        />
        <ThemedText style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
          Utilisateurs ({users.length})
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'auctions' && styles.tabButtonActive]}
        onPress={() => setActiveTab('auctions')}
      >
        <Ionicons 
          name="hammer-outline" 
          size={18} 
          color={activeTab === 'auctions' ? '#fff' : theme.iconColor} 
        />
        <ThemedText style={[styles.tabText, activeTab === 'auctions' && styles.tabTextActive]}>
          Enchères ({auctions.length})
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderUsersList = () => (
    <ThemedCard style={styles.listCard}>
      <View style={styles.listHeader}>
        <ThemedText style={styles.listTitle}>Gestion des utilisateurs</ThemedText>
        <ThemedText style={styles.listCount}>{users.length} utilisateurs</ThemedText>
      </View>

      {/* Table Headers */}
      <View style={styles.tableHeader}>
        <ThemedText style={[styles.headerCell, { flex: 2 }]}>Utilisateur</ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>Rôle</ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1 }]}>Statut</ThemedText>
        <ThemedText style={[styles.headerCell, { flex: 1.5 }]}>Actions</ThemedText>
      </View>

      <ScrollView style={styles.tableBody}>
        {users.map((userItem, index) => (
          <View key={userItem.id} style={[
            styles.tableRow,
            index % 2 === 0 && { backgroundColor: theme.uiBackground + '40' }
          ]}>
            {/* User Info */}
            <View style={{ flex: 2 }}>
              <ThemedText style={styles.userName}>
                {userItem.firstname} {userItem.lastname}
              </ThemedText>
              <ThemedText style={styles.userEmail}>{userItem.email}</ThemedText>
            </View>
            
            {/* Role Badge */}
            <View style={{ flex: 1 }}>
              <View style={[
                styles.roleBadge,
                { backgroundColor: userItem.role === 'ADMIN' ? Colors.primary : '#666' }
              ]}>
                <ThemedText style={styles.roleText}>{userItem.role}</ThemedText>
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={{ flex: 1 }}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: userItem.status === 'Activated' ? '#4ade80' : 
                                  userItem.status === 'Blocked' ? '#ef4444' : '#fbbf24' }
              ]}>
                <ThemedText style={styles.statusText}>{userItem.status}</ThemedText>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flex: 1.5, flexDirection: 'row', gap: 8 }}>
              {/* Block/Unblock Button */}
              <TouchableOpacity
                onPress={() => handleBlockUser(userItem.id, userItem.status)}
                disabled={processingUserId === userItem.id}
                style={[styles.actionButton, { backgroundColor: userItem.status === 'Blocked' ? '#4ade80' : '#ef4444' }]}
              >
                {processingUserId === userItem.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons 
                    name={userItem.status === 'Blocked' ? 'lock-open' : 'lock-closed'} 
                    size={16} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
              
              {/* Role Change Button */}
              <TouchableOpacity
                onPress={() => handleRoleChange(userItem.id, userItem.role)}
                disabled={processingUserId === userItem.id}
                style={[styles.actionButton, { backgroundColor: userItem.role === 'ADMIN' ? '#ff9800' : Colors.primary }]}
              >
                {processingUserId === userItem.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons 
                    name={userItem.role === 'ADMIN' ? 'person' : 'shield'} 
                    size={16} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedCard>
  );

  const renderAuctionsList = () => {
    const filteredAuctions = auctions.filter(auction => {
      if (auctionFilter === 'all') return true;
      return auction.status === auctionFilter;
    });

    return (
      <View>
        <View style={styles.auctionFilters}>
          {['all', 'active', 'pending', 'ended'].map((filter) => (
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
                      filter === 'pending' ? 'time' : 'stop-circle'} 
                size={14} 
                color={auctionFilter === filter ? '#fff' : '#666'} 
              />
              <ThemedText style={[
                styles.auctionFilterText,
                auctionFilter === filter && styles.auctionFilterTextActive
              ]}>
                {filter === 'all' ? 'Toutes' : 
                 filter === 'active' ? 'Actives' :
                 filter === 'pending' ? 'En attente' : 'Terminées'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {filteredAuctions.map(auction => (
          <TouchableOpacity key={auction.id} onPress={() => handleAuctionPress(auction)}>
            <ThemedCard style={styles.auctionItemCard}>
              <View style={styles.auctionItemHeader}>
                <ThemedText style={styles.auctionItemTitle}>{auction.title}</ThemedText>
                <View style={[
                  styles.smallStatusBadge,
                  { backgroundColor: auction.status === 'active' ? '#4ade80' :
                                   auction.status === 'pending' ? '#fbbf24' : '#ef4444' }
                ]}>
                  <ThemedText style={styles.smallStatusText}>{auction.status}</ThemedText>
                </View>
              </View>
              
              <View style={styles.auctionItemDetails}>
                <View style={styles.auctionItemDetail}>
                  <Ionicons name="person" size={14} color="#666" />
                  <ThemedText style={styles.auctionItemDetailText}>
                    {getSellerName(auction.sellerId)}
                  </ThemedText>
                </View>
                
                <View style={styles.auctionItemDetail}>
                  <Ionicons name="cash" size={14} color="#666" />
                  <ThemedText style={styles.auctionItemDetailText}>
                    {auction.startingPrice} TND
                  </ThemedText>
                </View>
                
                <View style={styles.auctionItemDetail}>
                  <Ionicons name="people" size={14} color="#666" />
                  <ThemedText style={styles.auctionItemDetailText}>
                    {auction.bidders ? Object.keys(auction.bidders).length : 0} enchérisseurs
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
            <ThemedText style={styles.modalTitle}>Détails de l'enchère</ThemedText>
            <TouchableOpacity onPress={() => setAuctionModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedAuction && (
            <ScrollView>
              {/* Tiny Images at Top */}
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
                <ThemedText style={styles.modalAuctionTitle}>{selectedAuction.title}</ThemedText>
                
                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="document-text" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    {selectedAuction.description}
                  </ThemedText>
                </View>

                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="person" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    Vendeur: {getSellerName(selectedAuction.sellerId)}
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
                    Expire le: {new Date(selectedAuction.expireDate).toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>

                <View style={styles.modalAuctionDetail}>
                  <Ionicons name="people" size={16} color={Colors.primary} />
                  <ThemedText style={styles.modalAuctionDetailText}>
                    Enchérisseurs: {selectedAuction.bidders ? Object.keys(selectedAuction.bidders).length : 0}
                  </ThemedText>
                </View>
              </ThemedCard>

              <ThemedCard style={styles.modalDepositsCard}>
                <ThemedText style={styles.modalDepositsTitle}>
                  Liste des enchérisseurs
                </ThemedText>

                {selectedAuction.bidders && Object.keys(selectedAuction.bidders).length > 0 ? (
                  Object.entries(selectedAuction.bidders)
                    .sort((a, b) => b[1] - a[1])
                    .map(([bidderId, amount], index) => (
                      <View key={bidderId} style={styles.bidderItem}>
                        <View style={styles.bidderRank}>
                          {index === 0 ? (
                            <Ionicons name="trophy" size={20} color="#fbbf24" />
                          ) : (
                            <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
                          )}
                        </View>
                        <ThemedText style={styles.bidderId}>
                          {bidderId.substring(0, 8)}...
                        </ThemedText>
                        <ThemedText style={styles.bidderAmount}>
                          {amount} TND
                        </ThemedText>
                      </View>
                    ))
                ) : (
                  <ThemedText style={styles.noDataText}>Aucun enchérisseur</ThemedText>
                )}
              </ThemedCard>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <ThemedText title style={styles.headerTitle}>Tableau de bord</ThemedText>
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={16} color="#fff" />
            <ThemedText style={styles.adminBadgeText}>ADMIN</ThemedText>
          </View>
        </View>

        {renderTabButtons()}

        {activeTab === 'overview' && (
          <>
            {renderStatsCards()}
            {renderDepositStats()}
            {renderDateFilter()}
            {renderCharts()}
          </>
        )}

        {activeTab === 'users' && renderUsersList()}
        {activeTab === 'auctions' && renderAuctionsList()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderAuctionDetails()}
    </ThemedView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    opacity: 0.7,
  },
  depositStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  depositStatCard: {
    flex: 1,
    padding: 12,
  },
  depositStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  depositStatTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  depositStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 6,
  },
  datePickerText: {
    fontSize: 12,
    color: '#333',
  },
  chartsContainer: {
    gap: 15,
  },
  chartCard: {
    padding: 15,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    opacity: 0.7,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chart: {
    borderRadius: 16,
  },
  listCard: {
    padding: 15,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listCount: {
    fontSize: 13,
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auctionFilters: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8,
    flexWrap: 'wrap',
  },
  auctionFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  auctionFilterChipActive: {
    backgroundColor: Colors.primary,
  },
  auctionFilterText: {
    fontSize: 12,
    color: '#666',
  },
  auctionFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  auctionItemCard: {
    marginBottom: 10,
    padding: 12,
  },
  auctionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  auctionItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  smallStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  smallStatusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  auctionItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  auctionItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auctionItemDetailText: {
    fontSize: 11,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoStrip: {
    marginBottom: 15,
  },
  photoContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  tinyPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalAuctionCard: {
    marginBottom: 15,
    padding: 15,
  },
  modalAuctionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalAuctionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    gap: 8,
  },
  modalAuctionDetailText: {
    fontSize: 13,
    flex: 1,
  },
  modalDepositsCard: {
    padding: 15,
  },
  modalDepositsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  bidderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  bidderRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 12,
    color: '#666',
  },
  bidderId: {
    flex: 1,
    fontSize: 12,
  },
  bidderAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  noDataText: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
    padding: 20,
  },
});