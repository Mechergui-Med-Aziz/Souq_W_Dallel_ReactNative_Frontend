import { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'react-native';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedButton from '../components/ThemedButton';
import ThemedTextInput from '../components/ThemedTextInput';
import ThemedCard from '../components/ThemedCard';
import Spacer from '../components/Spacer';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { createAuction } from '../store/slices/auctionSlice';
import { Colors } from '../constants/Colors';
import axiosInstance from '../lib/axios';

const CreateAuction = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    category: 'general',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'electronics', label: 'Electronics' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'collectibles', label: 'Collectibles' },
    { id: 'art', label: 'Art' },
    { id: 'jewelry', label: 'Jewelry' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'sports', label: 'Sports' },
    { id: 'general', label: 'General' },
  ];

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...selectedImages, ...result.assets];
      if (newImages.length > 10) {
        Alert.alert('Limit Exceeded', 'You can only upload up to 10 images.');
        setSelectedImages(newImages.slice(0, 10));
      } else {
        setSelectedImages(newImages);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...selectedImages, ...result.assets[0]];
      if (newImages.length > 10) {
        Alert.alert('Limit Exceeded', 'You can only upload up to 10 images.');
        setSelectedImages(newImages.slice(0, 10));
      } else {
        setSelectedImages(newImages);
      }
    }
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.startingPrice.trim()) {
      newErrors.startingPrice = 'Starting price is required';
    } else if (isNaN(formData.startingPrice) || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Starting price must be a positive number';
    }
    
    if (selectedImages.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const auctionData = {
        title: formData.title,
        description: formData.description,
        startingPrice: formData.startingPrice,
        category: formData.category,
      };

      await dispatch(createAuction({
        auctionData,
        photoFiles: selectedImages,
        currentUser: user // Pass current user to include as seller
      })).unwrap();
      
      Alert.alert(
        'Success',
        'Auction created successfully!',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
      
    } catch (error) {
      console.error('Create auction error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create auction. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Spacer height={40} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              Create Auction
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.formCard}>
              {/* Images Section */}
              <View style={styles.section}>
                <ThemedText title style={styles.sectionTitle}>
                  Auction Images ({selectedImages.length}/10)
                </ThemedText>
                
                {errors.images && (
                  <ThemedText style={styles.errorText}>{errors.images}</ThemedText>
                )}
                
                {/* Image Grid */}
                <View style={styles.imageGrid}>
                  {/* Add Image Buttons */}
                  <TouchableOpacity 
                    style={styles.addImageButton}
                    onPress={pickImages}
                    disabled={selectedImages.length >= 10}
                  >
                    <Ionicons name="images" size={30} color="#666" />
                    <ThemedText style={styles.addImageText}>
                      Add from Gallery
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.addImageButton}
                    onPress={takePhoto}
                    disabled={selectedImages.length >= 10}
                  >
                    <Ionicons name="camera" size={30} color="#666" />
                    <ThemedText style={styles.addImageText}>
                      Take Photo
                    </ThemedText>
                  </TouchableOpacity>
                  
                  {/* Selected Images */}
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image 
                        source={{ uri: image.uri }} 
                        style={styles.selectedImage}
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={Colors.warning} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {selectedImages.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearAllButton}
                    onPress={() => setSelectedImages([])}
                  >
                    <Ionicons name="trash" size={16} color={Colors.warning} />
                    <ThemedText style={styles.clearAllText}>
                      Clear All Images
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Basic Info */}
              <View style={styles.section}>
                <ThemedText title style={styles.sectionTitle}>
                  Auction Information
                </ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Title </ThemedText>
                  <ThemedTextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    placeholder="Enter auction title"
                    value={formData.title}
                    onChangeText={(value) => handleChange('title', value)}
                    maxLength={100}
                  />
                  {errors.title && <ThemedText style={styles.errorText}>{errors.title}</ThemedText>}

                  <ThemedText style={styles.inputLabel}>Description </ThemedText>
                  <TextInput
                    style={[styles.textArea, errors.description && styles.inputError]}
                    placeholder="Describe your item in detail"
                    value={formData.description}
                    onChangeText={(value) => handleChange('description', value)}
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                  />
                  {errors.description && <ThemedText style={styles.errorText}>{errors.description}</ThemedText>}

                  <ThemedText style={styles.inputLabel}>Starting Price ($) </ThemedText>
                  <ThemedTextInput
                    style={[styles.input, errors.startingPrice && styles.inputError]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={formData.startingPrice}
                    onChangeText={(value) => handleChange('startingPrice', value)}
                  />
                  {errors.startingPrice && <ThemedText style={styles.errorText}>{errors.startingPrice}</ThemedText>}

                  <ThemedText style={styles.inputLabel}>Category </ThemedText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                  >
                    {categories.map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          formData.category === category.id && styles.categoryButtonActive
                        ]}
                        onPress={() => handleChange('category', category.id)}
                      >
                        <ThemedText style={[
                          styles.categoryText,
                          formData.category === category.id && styles.categoryTextActive
                        ]}>
                          {category.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.section}>
                <ThemedText title style={styles.sectionTitle}>
                  Terms & Conditions
                </ThemedText>
                
                <View style={styles.termsContainer}>
                  <ThemedText style={styles.termsText}>
                    • By creating this auction, you agree to the terms of service
                  </ThemedText>
                  <ThemedText style={styles.termsText}>
                    • You must be the legal owner of the item
                  </ThemedText>
                  <ThemedText style={styles.termsText}>
                    • Provide accurate descriptions and clear photos
                  </ThemedText>
                  <ThemedText style={styles.termsText}>
                    • You are responsible for shipping or delivery arrangements
                  </ThemedText>
                  <ThemedText style={styles.termsText}>
                    • Auction fees may apply upon successful sale
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>

            <Spacer height={30} />

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <ThemedButton
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitButton, loading && styles.disabledButton]}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <Ionicons name="time-outline" size={22} color="#fff" />
                  ) : (
                    <Ionicons name="hammer" size={22} color="#fff" />
                  )}
                  <ThemedText style={styles.buttonText}>
                    {loading ? 'Creating...' : 'Create Auction'}
                  </ThemedText>
                </View>
              </ThemedButton>

              <Spacer height={15} />

              <ThemedButton
                onPress={() => router.back()}
                style={styles.cancelButton}
                variant="secondary"
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="close-circle" size={22} color={theme.text} />
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </View>
              </ThemedButton>
            </View>

            <Spacer height={40} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default CreateAuction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  formCard: {
    borderRadius: 20,
    padding: 25,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  clearAllText: {
    fontSize: 14,
    color: Colors.warning,
    marginLeft: 5,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    marginTop: 15,
    opacity: 0.8,
  },
  input: {
    padding: 14,
    fontSize: 16,
    fontWeight: 'bold',
    borderRadius: 10,
  },
  textArea: {
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  categoriesScroll: {
    marginTop: 10,
    marginBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  termsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  termsText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});