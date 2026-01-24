import { StyleSheet, Text, Alert } from 'react-native';
import { useState, useEffect } from "react";
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
  
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { register, loading, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstname.trim()) errors.firstname = 'First name is required';
    if (!formData.lastname.trim()) errors.lastname = 'Last name is required';
    if (!formData.cin.trim()) errors.cin = 'CIN is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password.trim()) errors.password = 'Password is required';
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }
    
    setSuccessMessage('');
    
    try {
      await register(formData);
      setSuccessMessage('Registration successful! Please login with your credentials.');
      
      // Clear form
      setFormData({
        firstname: '',
        lastname: '',
        cin: '',
        email: '',
        password: '',
        role: 'USER'
      });
      
      setFormErrors({});
      
    } catch (err) {
      // Error is handled by Redux
      console.log('Registration error caught in component:', err);
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
          style={[styles.input, formErrors.firstname && styles.inputError]}
          placeholder="First Name"
          onChangeText={(value) => handleChange('firstname', value)}
          value={formData.firstname}
        />
        {formErrors.firstname && <Text style={styles.errorText}>{formErrors.firstname}</Text>}

        <ThemedTextInput
          style={[styles.input, formErrors.lastname && styles.inputError]}
          placeholder="Last Name"
          onChangeText={(value) => handleChange('lastname', value)}
          value={formData.lastname}
        />
        {formErrors.lastname && <Text style={styles.errorText}>{formErrors.lastname}</Text>}

        <ThemedTextInput
          style={[styles.input, formErrors.cin && styles.inputError]}
          placeholder="CIN"
          keyboardType="numeric"
          onChangeText={(value) => handleChange('cin', value)}
          value={formData.cin}
        />
        {formErrors.cin && <Text style={styles.errorText}>{formErrors.cin}</Text>}

        <ThemedTextInput
          style={[styles.input, formErrors.email && styles.inputError]}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('email', value)}
          value={formData.email}
        />
        {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

        <ThemedTextInput
          style={[styles.input, formErrors.password && styles.inputError]}
          placeholder="Password (min 6 characters)"
          autoCapitalize="none"
          onChangeText={(value) => handleChange('password', value)}
          value={formData.password}
          secureTextEntry
        />
        {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}

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

        {successMessage && (
          <Text style={styles.success}> {successMessage} </Text>
        )}

        {error && <Text style={styles.error}> {error} </Text>}

        <Spacer height={40} />

        <Link href='/login'>
          <ThemedText style={{ textAlign: 'center'}}>
            Already have an account? Login instead
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 21,
    marginBottom: 30
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: '10%',
  },
  success: {
    color: 'green',
    padding: 10,
    width: '90%',
    backgroundColor: '#d4edda',
    borderColor: 'green',
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
    textAlign: 'center',
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
  },
  note: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  }
});