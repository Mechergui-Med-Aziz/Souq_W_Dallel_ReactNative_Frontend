import { StyleSheet, Text } from 'react-native';
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import { useAuth } from "../../hooks/useAuth";
import ThemedButton from "../../components/ThemedButton";

const Profile = () => {
  const { user, logout } = useAuth();
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText title={true} style={styles.heading}>
        {user?.email}
      </ThemedText>
      <Spacer />

      {user?.firstname && (
        <>
          <ThemedText>Name: {user.firstname} {user.lastname}</ThemedText>
          <Spacer />
        </>
      )}

      <ThemedText>Welcome to the Dashboard!</ThemedText>
      <Spacer />

      <ThemedButton onPress={logout}>
        <Text style={{ color: '#f2f2f2' }}> Logout </Text>
      </ThemedButton>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center"
  }
});