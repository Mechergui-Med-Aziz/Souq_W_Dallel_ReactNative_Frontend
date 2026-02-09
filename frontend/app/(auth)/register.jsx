import { useState } from "react";
import { StyleSheet, Text, Alert, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useRouter } from "expo-router";
import { Keyboard } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from "../../components/ThemedTextInput";
import Spacer from '../../components/Spacer';
import { useAuth } from "../../hooks/useAuth";
import { Colors } from "../../constants/Colors";

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    cin: '',
    email: '',
    password: '',
    role: 'USER'
  });
  
  const { register, loading, error } = useAuth();
  const router = useRouter();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstname || !formData.lastname || !formData.cin || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    try {
      await AsyncStorage.multiRemove([
        'verificationCode', 
        'pendingVerificationEmail', 
        'pendingRegistrationPassword'
      ]);
      
      const result = await register(formData);
      
      if (result.payload && result.payload.code) {
        await AsyncStorage.setItem('verificationCode', result.payload.code);
        await AsyncStorage.setItem('pendingVerificationEmail', formData.email);
        await AsyncStorage.setItem('pendingRegistrationPassword', formData.password);
        
        Alert.alert(
          'Registration Successful!',
          `A verification code has been sent to ${formData.email}. You will be logged in automatically after verification.`,
          [{ 
            text: 'Verify Now', 
            onPress: () => router.replace('/verify-account') 
          }]
        );
      }
      
    } catch (err) {
      Alert.alert('Registration Failed', err || 'Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView safe style={styles.container}>
        <Spacer height={40} />
        
        <ThemedText title={true} style={styles.title}>
          Register
        </ThemedText>

        <ThemedTextInput
          style={styles.input}
          placeholder="First Name"
          onChangeText={(value) => handleChange('firstname', value)}
          value={formData.firstname}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Last Name"
          onChangeText={(value) => handleChange('lastname', value)}
          value={formData.lastname}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="CIN"
          keyboardType="numeric"
          onChangeText={(value) => handleChange('cin', value)}
          value={formData.cin}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('email', value)}
          value={formData.email}
        />

        <ThemedTextInput
          style={styles.input}
          placeholder="Password"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('password', value)}
          value={formData.password}
          secureTextEntry
        />

        <ThemedButton 
          onPress={handleSubmit} 
          disabled={loading}
          style={loading && styles.disabledButton}
        >
          <Text style={{ color: '#f2f2f2'}}>
            {loading ? 'Registering...' : 'Register'}
          </Text>
        </ThemedButton>

        <Spacer />

        {error && <Text style={styles.error}> {error} </Text>}

        <Spacer height={40} />

        <TouchableOpacity onPress={() => router.push('/login')}>
          <ThemedText style={{ textAlign: 'center'}}>
            Already have an account? Login
          </ThemedText>
        </TouchableOpacity>

        <Spacer height={20} />

        <TouchableOpacity onPress={() => router.push('/reset-password')}>
          <ThemedText style={{ textAlign: 'center', color: Colors.primary }}>
            Forgot Password?
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

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
    marginBottom: 15,
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

export default Register;