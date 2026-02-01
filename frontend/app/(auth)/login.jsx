import { StyleSheet, Text, Alert } from 'react-native';
import { useState } from "react";
import { Link, useRouter} from "expo-router";
import { TouchableOpacity } from 'react-native';

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
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <Spacer height={40} />
      
      <ThemedText title={true} style={styles.title}>
        Login
      </ThemedText>

      <ThemedTextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
      />

      <ThemedTextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />

      <ThemedButton 
        onPress={handleSubmit} 
        disabled={loading}
        style={loading && styles.disabledButton}
      >
        <Text style={{ color: '#f2f2f2'}}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </ThemedButton>

      <Spacer />

      {error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      <Spacer height={40} />

      <Link href='/register'>
        <ThemedText style={{ textAlign: 'center'}}>
          Don't have an account? Register
        </ThemedText>
      </Link>

      <Spacer height={20} />

      <TouchableOpacity onPress={() => router.push('/reset-password')}>
        <ThemedText style={{ textAlign: 'center', color: Colors.primary }}>
          Forgot Password?
        </ThemedText>
      </TouchableOpacity>

    </ThemedView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    marginBottom: 20,
  },
  error: {
    color: Colors.warning,
    padding: 10,
    width: '90%',
    backgroundColor: '#f5c1c8',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  }
});