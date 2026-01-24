import { StyleSheet, Text } from 'react-native';
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { TouchableWithoutFeedback } from "react-native";
import { Keyboard } from "react-native";
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import Spacer from '../../components/Spacer';
import ThemedTextInput from "../../components/ThemedTextInput";
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
    try {
      await register(formData);
      router.replace('/login');
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Spacer />
        
        <ThemedText title={true} style={styles.title}>
          Register For an Account
        </ThemedText>

        <ThemedTextInput
          style={{ width: '80%', marginBottom: 15 }}
          placeholder="First Name"
          onChangeText={(value) => handleChange('firstname', value)}
          value={formData.firstname}
        />

        <ThemedTextInput
          style={{ width: '80%', marginBottom: 15 }}
          placeholder="Last Name"
          onChangeText={(value) => handleChange('lastname', value)}
          value={formData.lastname}
        />

        <ThemedTextInput
          style={{ width: '80%', marginBottom: 15 }}
          placeholder="CIN"
          keyboardType="numeric"
          onChangeText={(value) => handleChange('cin', value)}
          value={formData.cin}
        />

        <ThemedTextInput
          style={{ width: '80%', marginBottom: 15 }}
          placeholder="Email"
          keyboardType="email-address"
          onChangeText={(value) => handleChange('email', value)}
          value={formData.email}
        />

        <ThemedTextInput
          style={{ width: '80%', marginBottom: 20 }}
          placeholder="Password"
          onChangeText={(value) => handleChange('password', value)}
          value={formData.password}
          secureTextEntry
        />

        <ThemedButton onPress={handleSubmit} disabled={loading}>
          <Text style={{ color: '#f2f2f2'}}>
            {loading ? 'Registering...' : 'Register'}
          </Text>
        </ThemedButton>

        <Spacer />

        {error && <Text style={styles.error}> {error} </Text>}

        <Spacer height={100} />

        <Link href='/login'>
          <ThemedText style={{ textAlign: 'center'}}>
            Login instead
          </ThemedText>
        </Link>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Register;

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