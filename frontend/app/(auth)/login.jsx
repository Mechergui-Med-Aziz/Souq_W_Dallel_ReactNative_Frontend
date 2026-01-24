import { StyleSheet, Text } from 'react-native';
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      await login(email, password);
      router.replace('/(dashboard)');
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      
      <ThemedText title={true} style={styles.title}>
        Login to Your Account
      </ThemedText>

      <ThemedTextInput
        style={{ width: '80%', marginBottom: 20 }}
        placeholder="Email"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />

      <ThemedTextInput
        style={{ width: '80%', marginBottom: 20 }}
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />

      <ThemedButton onPress={handleSubmit} disabled={loading}>
        <Text style={{ color: '#f2f2f2'}}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </ThemedButton>

      <Spacer />

      {error && <Text style={styles.error}> {error} </Text>}

      <Spacer height={100} />

      <Link href='/register'>
        <ThemedText style={{ textAlign: 'center'}}>
          Register instead
        </ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    textAlign: 'center',
    fontSize: 21,
    marginBottom: 30
  },
  error: {
    color: Colors.warning,
    padding: 10,
    width: '80%',
    backgroundColor: '#f5c1c8',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10
  }
});