import { StyleSheet, View, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from "../components/ThemedView";
import ThemedLogo from "../components/ThemedLogo";
import ThemedText from "../components/ThemedText";
import ThemedCard from "../components/ThemedCard";
import Spacer from "../components/Spacer";
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';

const Home = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Logo */}
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <ThemedLogo style={styles.logo} />
          <Spacer height={10} />
          <ThemedText title style={styles.welcomeTitle}>
            {user ? `Welcome, ${user?.email?.split('@')[0] || 'User'}!` : 'Auction App'}
          </ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            {user ? 'Browse amazing auctions' : 'Login to start bidding'}
          </ThemedText>
        </View>

        <View style={styles.content}>
          {/* Featured Auctions Card */}
          <ThemedCard style={styles.auctionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="flame" size={24} color={Colors.primary} />
              <ThemedText title style={styles.cardTitle}>
                Live Auctions
              </ThemedText>
            </View>
            
            <ThemedText style={styles.cardDescription}>
              Discover unique items up for bidding.
            </ThemedText>

            {/* Single Auction Item */}
            <View style={styles.auctionItem}>
              <View style={styles.auctionIconContainer}>
                <Ionicons name="watch" size={20} color={theme.iconColor} />
              </View>
              <View style={styles.auctionDetails}>
                <ThemedText style={styles.auctionName}>Vintage Rolex Watch</ThemedText>
                <View style={styles.auctionInfo}>
                  <ThemedText style={styles.auctionPrice}>Current: $1,250</ThemedText>
                  <ThemedText style={styles.auctionTime}>2h 30m</ThemedText>
                </View>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={15} />

          {/* Categories Section */}
          <ThemedCard style={styles.categoriesCard}>
            <ThemedText title style={styles.sectionTitle}>
              Categories
            </ThemedText>
            
            <View style={styles.categoriesGrid}>
              <View style={styles.categoryItem}>
                <Ionicons name="watch" size={20} color={Colors.primary} />
                <ThemedText style={styles.categoryText}>Watches</ThemedText>
              </View>
              
              <View style={styles.categoryItem}>
                <Ionicons name="brush" size={20} color={Colors.primary} />
                <ThemedText style={styles.categoryText}>Art</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20} />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  logo: {
    width: 100,
    height: 50,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    padding: 16,
    marginTop: -25,
  },
  auctionCard: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: 16,
  },
  auctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  auctionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  auctionDetails: {
    flex: 1,
  },
  auctionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  auctionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auctionPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  auctionTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  categoriesCard: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  loginPromptCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginText: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
});