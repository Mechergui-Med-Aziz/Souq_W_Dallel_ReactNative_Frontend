import { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedCard from '../../components/ThemedCard';
import Spacer from '../../components/Spacer';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAuctionById, updateAuctionWithPhotos } from '../../store/slices/auctionSlice';
import { Colors } from '../../constants/Colors';
import { auctionService } from '../../store/services/auctionService';

const categories = [
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'vehicles', label: 'Vehicles', icon: 'car-outline' },
  { id: 'real-estate', label: 'Real Estate', icon: 'home-outline' },
  { id: 'collectibles', label: 'Collectibles', icon: 'albums-outline' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline' },
  { id: 'jewelry', label: 'Jewelry', icon: 'diamond-outline' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt-outline' },
  { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
  { id: 'general', label: 'General', icon: 'apps-outline' },
];

const statusOptions = [
  { id: 'active', label: 'Active', color: '#4ade80' },
  { id: 'pending', label: 'Pending', color: '#fbbf24' },
  { id: 'ended', label: 'Ended', color: '#ef4444' },
];

const EditAuction = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const dispatch = useAppDispatch();
  const { currentAuction, loading, updating } = useAppSelector((state) => state.auction);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    category: 'general',
    status: 'active',
    expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  const [errors, setErrors] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      dispatch(fetchAuctionById(id));
    }
  }, [id]);

  useEffect(() => {
    if (currentAuction) {
      setFormData({
        title: currentAuction.title || '',
        description: currentAuction.description || '',
        startingPrice: currentAuction.startingPrice?.toString() || '',
        category: currentAuction.category || 'general',
        status: currentAuction.status || 'active',
        expireDate: currentAuction.expireDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      setTempDate(new Date(currentAuction.expireDate || Date.now() + 7 * 24 * 60 * 60 * 1000));
      
      if (currentAuction.photoId?.length) {
        setExistingImages(currentAuction.photoId.map(id => ({ id })));
      }
    }
  }, [currentAuction]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 10 - (existingImages.length + newImages.length),
    });

    if (!result.canceled && result.assets) {
      setNewImages([...newImages, ...result.assets]);
    }
  };

  const removeExistingImage = (index) => {
    const removedId = existingImages[index].id;
    setRemovedPhotoIds([...removedPhotoIds, removedId]);
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title required';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (!formData.startingPrice.trim()) newErrors.startingPrice = 'Starting price required';
    else if (isNaN(formData.startingPrice) || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Must be positive number';
    }
    if (!formData.category) newErrors.category = 'Category required';
    if (existingImages.length + newImages.length === 0) newErrors.images = 'At least one image required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const auctionData = {
        ...currentAuction, 
        title: formData.title,
        description: formData.description,
        startingPrice: parseFloat(formData.startingPrice),
        category: formData.category,
        status: formData.status,
        expireDate: formData.expireDate,
      };

      await dispatch(updateAuctionWithPhotos({
        auctionId: id,
        auctionData,
        photoFiles: newImages,
        removedPhotoIds
      })).unwrap();
      
      Alert.alert('Success', 'Auction updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update auction');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      setFormData({ ...formData, expireDate: selectedDate.toISOString() });
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || !currentAuction) {
    return (
      <ThemedView safe style={styles.centerContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const allImagesCount = existingImages.length + newImages.length;

  return (
    <ThemedView safe style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>Edit Auction</ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.formCard}>
              
              {/* Images Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="images" size={22} color={Colors.primary} />
                  <ThemedText style={styles.sectionTitle}>Images ({allImagesCount}/10)</ThemedText>
                </View>
                
                {errors.images && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                    <ThemedText style={styles.errorText}>{errors.images}</ThemedText>
                  </View>
                )}
                
                <View style={styles.imageGrid}>
                  {allImagesCount < 10 && (
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                      <Ionicons name="add" size={30} color={Colors.primary} />
                      <ThemedText style={styles.addImageText}>Add Images</ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {existingImages.map((img, idx) => (
                    <View key={`existing-${idx}`} style={styles.imageContainer}>
                      <Image 
                        source={{ uri: auctionService.getAuctionPhotoUrl(currentAuction.id, img.id) }} 
                        style={styles.image}
                      />
                      <TouchableOpacity style={styles.removeButton} onPress={() => removeExistingImage(idx)}>
                        <Ionicons name="close-circle" size={24} color={Colors.warning} />
                      </TouchableOpacity>
                      <View style={styles.existingBadge}>
                        <ThemedText style={styles.badgeText}>Existing</ThemedText>
                      </View>
                    </View>
                  ))}
                  
                  {newImages.map((img, idx) => (
                    <View key={`new-${idx}`} style={styles.imageContainer}>
                      <Image source={{ uri: img.uri }} style={styles.image} />
                      <TouchableOpacity style={styles.removeButton} onPress={() => removeNewImage(idx)}>
                        <Ionicons name="close-circle" size={24} color={Colors.warning} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.section}>
                <ThemedText style={styles.label}>Title</ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={formData.title}
                  onChangeText={(v) => setFormData({...formData, title: v})}
                />
                {errors.title && <ThemedText style={styles.errorText}>{errors.title}</ThemedText>}

                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.textArea, errors.description && styles.inputError]}
                  value={formData.description}
                  onChangeText={(v) => setFormData({...formData, description: v})}
                  multiline
                  numberOfLines={4}
                />
                {errors.description && <ThemedText style={styles.errorText}>{errors.description}</ThemedText>}

                <ThemedText style={styles.label}>Starting Price ($)</ThemedText>
                <ThemedTextInput
                  style={[styles.input, errors.startingPrice && styles.inputError]}
                  value={formData.startingPrice}
                  onChangeText={(v) => setFormData({...formData, startingPrice: v})}
                  keyboardType="decimal-pad"
                />
                {errors.startingPrice && <ThemedText style={styles.errorText}>{errors.startingPrice}</ThemedText>}

                <ThemedText style={styles.label}>Category</ThemedText>
                <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryModal(true)}>
                  <View style={styles.pickerContent}>
                    <Ionicons 
                      name={categories.find(c => c.id === formData.category)?.icon || 'apps-outline'} 
                      size={20} color={Colors.primary} 
                    />
                    <ThemedText style={styles.pickerText}>
                      {categories.find(c => c.id === formData.category)?.label || 'Select'}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.category && <ThemedText style={styles.errorText}>{errors.category}</ThemedText>}

                <ThemedText style={styles.label}>Status</ThemedText>
                <View style={styles.statusContainer}>
                  {statusOptions.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.statusButton,
                        formData.status === s.id && { backgroundColor: s.color }
                      ]}
                      onPress={() => setFormData({...formData, status: s.id})}
                    >
                      <ThemedText style={formData.status === s.id ? styles.statusTextActive : styles.statusText}>
                        {s.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <ThemedText style={styles.label}>Expiration Date</ThemedText>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                  <ThemedText style={styles.dateText}>{formatDate(formData.expireDate)}</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedCard>

            <ThemedButton onPress={handleSubmit} disabled={updating} style={styles.submitButton}>
              <ThemedText style={{ color: '#fff' }}>
                {updating ? 'Updating...' : 'Update Auction'}
              </ThemedText>
            </ThemedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, formData.category === cat.id && styles.categoryItemActive]}
                  onPress={() => {
                    setFormData({...formData, category: cat.id});
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.categoryItemLeft}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name={cat.icon} size={22} color={formData.category === cat.id ? '#fff' : Colors.primary} />
                    </View>
                    <ThemedText style={formData.category === cat.id ? styles.categoryTextActive : styles.categoryText}>
                      {cat.label}
                    </ThemedText>
                  </View>
                  {formData.category === cat.id && <Ionicons name="checkmark" size={22} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="datetime"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </ThemedView>
  );
};

export default EditAuction;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  formCard: {
    borderRadius: 20,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '10',
  },
  addImageText: {
    fontSize: 12,
    marginTop: 5,
    color: Colors.primary,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  existingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    padding: 14,
    fontSize: 16,
    borderRadius: 12,
  },
  textArea: {
    padding: 14,
    fontSize: 16,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f5f5f5',
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginLeft: 6,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  submitButton: {
    marginTop: 25,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  categoryItemActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 16,
  },
  categoryTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});