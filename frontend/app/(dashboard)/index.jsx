import { StyleSheet, Text } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';

const DashboardHome = () => {
  const { user } = useAuth();
  
  return (
    <ThemedView style={styles.container}>
      <Spacer />
      
      <ThemedText title={true} style={styles.title}>
        Welcome to Dashboard
      </ThemedText>
      
      <Spacer height={20} />
      
      {user && (
        <>
          <ThemedText>Email: {user.email}</ThemedText>
          <Spacer />
          <ThemedText>User ID: {user.id}</ThemedText>
        </>
      )}
      
      <Spacer height={40} />
      
      <ThemedText style={styles.info}>
        This is your main dashboard. You can navigate to Profile using the bottom tabs.
      </ThemedText>
    </ThemedView>
  );
};

export default DashboardHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
});