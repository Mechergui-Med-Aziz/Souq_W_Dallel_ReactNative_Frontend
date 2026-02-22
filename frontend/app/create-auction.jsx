import { useState, useRef } from 'react';
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

const categories = [
  { id: 'electronics', label: 'Électronique', icon: 'tv-outline' },
  { id: 'furniture', label: 'Meubles', icon: 'bed-outline' },
  { id: 'vehicles', label: 'Véhicules', icon: 'car-outline' },
  { id: 'real-estate', label: 'Immobilier', icon: 'home-outline' },
  { id: 'collectibles', label: 'Collection', icon: 'albums-outline' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline' },
  { id: 'jewelry', label: 'Bijoux', icon: 'diamond-outline' },
  { id: 'clothing', label: 'Vêtements', icon: 'shirt-outline' },
  { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
  { id: 'general', label: 'Général', icon: 'apps-outline' },
];

const durationOptions = [
  { id: '1', label: '1 Jour', hours: 24, color: '#4ade80' },
  { id: '3', label: '3 Jours', hours: 72, color: '#3b82f6' },
  { id: '7', label: '7 Jours', hours: 168, color: '#8b5cf6' },
  { id: '14', label: '14 Jours', hours: 336, color: '#ec4899' },
  { id: 'custom', label: 'Personnalisé', hours: null, color: '#f59e0b' },
];

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const daysOfWeek = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const CreateAuction = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    category: 'general',
  });
  
  // Date state
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState('7');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
  // Calendar state
  const [tempDate, setTempDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('PM');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Reset form function
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startingPrice: '',
      category: 'general',
    });
    setExpirationDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setSelectedImages([]);
    setErrors({});
    setSelectedDuration('7');
    
    // Reset calendar state
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setTempDate(defaultDate);
    setSelectedHour(defaultDate.getHours() % 12 || 12);
    setSelectedMinute(defaultDate.getMinutes());
    setSelectedAmPm(defaultDate.getHours() >= 12 ? 'PM' : 'AM');
    setCurrentMonth(defaultDate.getMonth());
    setCurrentYear(defaultDate.getFullYear());
  };

  // Generate calendar days
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to Monday (0) format
    return day === 0 ? 6 : day - 1;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    
    const days = [];
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true });
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, empty: false });
    }
    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day) => {
    const newDate = new Date(
      currentYear, 
      currentMonth, 
      day, 
      selectedAmPm === 'PM' && selectedHour < 12 ? selectedHour + 12 : 
      selectedAmPm === 'AM' && selectedHour === 12 ? 0 : selectedHour, 
      selectedMinute
    );
    setTempDate(newDate);
    
    // Optional haptic feedback
    if (Platform.OS === 'ios') {
      const Haptic = require('expo-haptics');
      Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
    }
  };

  const handleHourChange = (increment) => {
    let newHour = selectedHour + increment;
    if (newHour < 1) newHour = 12;
    if (newHour > 12) newHour = 1;
    setSelectedHour(newHour);
    
    updateTempDateWithTime(newHour, selectedMinute, selectedAmPm);
  };

  const handleMinuteChange = (increment) => {
    let newMinute = selectedMinute + increment;
    if (newMinute < 0) newMinute = 59;
    if (newMinute > 59) newMinute = 0;
    setSelectedMinute(newMinute);
    
    updateTempDateWithTime(selectedHour, newMinute, selectedAmPm);
  };

  const handleAmPmChange = (amPm) => {
    setSelectedAmPm(amPm);
    updateTempDateWithTime(selectedHour, selectedMinute, amPm);
  };

  const updateTempDateWithTime = (hour, minute, amPm) => {
    const newDate = new Date(tempDate);
    let hours24 = hour;
    if (amPm === 'PM' && hour < 12) hours24 = hour + 12;
    if (amPm === 'AM' && hour === 12) hours24 = 0;
    
    newDate.setHours(hours24);
    newDate.setMinutes(minute);
    setTempDate(newDate);
  };

  const handleDateConfirm = () => {
    // Ensure date is in the future
    const now = new Date();
    if (tempDate <= now) {
      Alert.alert('Date invalide', 'La date d\'expiration doit être dans le futur');
      return;
    }
    
    console.log('Setting expiration date to:', tempDate);
    console.log('ISO string:', tempDate.toISOString());
    
    setExpirationDate(tempDate);
    setSelectedDuration('custom');
    setShowDatePickerModal(false);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie pour uploader des photos.');
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
        Alert.alert('Limite dépassée', 'Vous ne pouvez uploader que 10 images maximum.');
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

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 20;
    setShowScrollIndicator(!isAtEnd);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (!formData.startingPrice.trim()) {
      newErrors.startingPrice = 'Le prix de départ est requis';
    } else if (isNaN(formData.startingPrice) || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Le prix doit être un nombre positif';
    }
    
    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    // Validate expiration date is in the future
    const now = new Date();
    if (expirationDate <= now) {
      newErrors.expirationDate = 'La date d\'expiration doit être dans le futur';
    }
    
    if (selectedImages.length === 0) {
      newErrors.images = 'Au moins une image est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      // Make sure expirationDate is properly set
      console.log('Expiration date before sending:', expirationDate);
      console.log('Expiration date ISO string:', expirationDate.toISOString());
      
      const auctionData = {
        title: formData.title,
        description: formData.description,
        startingPrice: parseFloat(formData.startingPrice),
        category: formData.category,
        sellerId: user.id,
        expireDate: expirationDate, // Send the Date object directly
      };

      console.log('Submitting auction with data:', auctionData);

      await dispatch(createAuction({
        auctionData,
        photoFiles: selectedImages,
        userId: user.id
      })).unwrap();
      
      resetForm();
      
      Alert.alert(
        'Succès',
        'Enchère créée avec succès !',
        [{ 
          text: 'OK', 
          onPress: () => router.replace('/')
        }]
      );
      
    } catch (error) {
      console.error('Create auction error:', error);
      Alert.alert('Erreur', error.message || 'Échec de la création de l\'enchère.');
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

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration.id);
    if (duration.hours) {
      const newDate = new Date(Date.now() + duration.hours * 60 * 60 * 1000);
      console.log('Setting expiration date from duration:', newDate);
      setExpirationDate(newDate);
      setTempDate(newDate);
      
      // Update time picker values
      const hours24 = newDate.getHours();
      setSelectedHour(hours24 % 12 || 12);
      setSelectedMinute(newDate.getMinutes());
      setSelectedAmPm(hours24 >= 12 ? 'PM' : 'AM');
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
    } else {
      // For custom, open date picker modal
      setTempDate(expirationDate);
      
      const hours24 = expirationDate.getHours();
      setSelectedHour(hours24 % 12 || 12);
      setSelectedMinute(expirationDate.getMinutes());
      setSelectedAmPm(hours24 >= 12 ? 'PM' : 'AM');
      setCurrentMonth(expirationDate.getMonth());
      setCurrentYear(expirationDate.getFullYear());
      
      setShowDatePickerModal(true);
    }
  };

  const formatExpirationDate = (date) => {
    if (!date) return 'Sélectionner une date';
    return date.toLocaleDateString('fr-FR') + ' à ' + 
           date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryLabel = () => {
    const category = categories.find(c => c.id === formData.category);
    return category ? category.label : 'Sélectionner une catégorie';
  };

  const getDaysRemaining = (date) => {
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calendarDays = generateCalendarDays();

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
          <Spacer height={10} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.iconColorFocused} />
            </TouchableOpacity>
            <ThemedText title style={styles.headerTitle}>
              Créer une enchère
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <ThemedCard style={styles.formCard}>
              {/* Images Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="images" size={22} color={Colors.primary} />
                  <ThemedText style={styles.sectionTitle}>
                    Images ({selectedImages.length}/10)
                  </ThemedText>
                </View>
                
                {errors.images && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                    <ThemedText style={styles.errorText}>{errors.images}</ThemedText>
                  </View>
                )}
                
                <View style={styles.imageScrollContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageScroll}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                  >
                    <View style={styles.imageGrid}>
                      {/* Gallery Button */}
                      <TouchableOpacity 
                        style={styles.galleryButton}
                        onPress={pickImages}
                        disabled={selectedImages.length >= 10}
                      >
                        <Ionicons name="images" size={30} color={Colors.primary} />
                        <ThemedText style={styles.galleryButtonText}>
                          Galerie
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
                            <Ionicons name="close-circle" size={20} color={Colors.warning} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  
                  {/* Scroll Indicator */}
                  {showScrollIndicator && selectedImages.length > 3 && (
                    <View style={styles.scrollIndicator}>
                      <Ionicons name="arrow-forward-circle" size={24} color={Colors.primary} />
                    </View>
                  )}
                </View>
              </View>

              {/* Basic Info */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle" size={22} color={Colors.primary} />
                  <ThemedText style={styles.sectionTitle}>
                    Informations
                  </ThemedText>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="pencil" size={18} color={Colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.title && styles.inputError]}
                      placeholder="Titre de l'enchère"
                      placeholderTextColor="#999"
                      value={formData.title}
                      onChangeText={(value) => handleChange('title', value)}
                      maxLength={100}
                    />
                  </View>
                  {errors.title && (
                    <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons name="document-text" size={18} color={Colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textArea, errors.description && styles.inputError]}
                      placeholder="Description détaillée de l'article"
                      placeholderTextColor="#999"
                      value={formData.description}
                      onChangeText={(value) => handleChange('description', value)}
                      multiline
                      numberOfLines={4}
                      maxLength={1000}
                    />
                  </View>
                  {errors.description && (
                    <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons name="cash" size={18} color={Colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, errors.startingPrice && styles.inputError]}
                      placeholder="Prix de départ (TND)"
                      placeholderTextColor="#999"
                      keyboardType="decimal-pad"
                      value={formData.startingPrice}
                      onChangeText={(value) => handleChange('startingPrice', value)}
                    />
                  </View>
                  {errors.startingPrice && (
                    <ThemedText style={styles.errorText}>{errors.startingPrice}</ThemedText>
                  )}

                  {/* Category Picker */}
                  <TouchableOpacity
                    style={[styles.pickerButton, errors.category && styles.inputError]}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <View style={styles.pickerButtonContent}>
                      <Ionicons 
                        name={categories.find(c => c.id === formData.category)?.icon || 'apps-outline'} 
                        size={20} 
                        color={Colors.primary} 
                      />
                      <ThemedText style={styles.pickerButtonText}>
                        {getCategoryLabel()}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                  {errors.category && (
                    <ThemedText style={styles.errorText}>{errors.category}</ThemedText>
                  )}

                  {/* Expiration Time */}
                  <View style={styles.expirationSection}>
                    <View style={styles.expirationHeader}>
                      <Ionicons name="time" size={20} color={Colors.primary} />
                      <ThemedText style={styles.expirationHeaderText}>Durée de l'enchère</ThemedText>
                    </View>
                    
                    {/* Duration Options */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationScroll}>
                      <View style={styles.durationContainer}>
                        {durationOptions.map(duration => (
                          <TouchableOpacity
                            key={duration.id}
                            style={[
                              styles.durationButton,
                              selectedDuration === duration.id && { 
                                backgroundColor: duration.color,
                                borderColor: duration.color 
                              }
                            ]}
                            onPress={() => handleDurationSelect(duration)}
                          >
                            <ThemedText style={[
                              styles.durationButtonText,
                              selectedDuration === duration.id && styles.durationButtonTextActive
                            ]}>
                              {duration.label}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Selected Date Display */}
                    <TouchableOpacity
                      style={styles.selectedDateContainer}
                      onPress={() => handleDurationSelect(durationOptions.find(d => d.id === 'custom'))}
                    >
                      <View style={styles.dateInfo}>
                        <Ionicons name="calendar" size={20} color={Colors.primary} />
                        <View style={styles.dateTextContainer}>
                          <ThemedText style={styles.dateLabel}>Se termine le</ThemedText>
                          <ThemedText style={styles.dateValue}>
                            {formatExpirationDate(expirationDate)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.daysBadge}>
                        <ThemedText style={styles.daysBadgeText}>
                          {getDaysRemaining(expirationDate)} jours
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    
                    {errors.expirationDate && (
                      <ThemedText style={styles.errorText}>{errors.expirationDate}</ThemedText>
                    )}
                  </View>
                </View>
              </View>
            </ThemedCard>

            <Spacer height={30} />

            <View style={styles.buttonsContainer}>
              <ThemedButton
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitButton, loading && styles.disabledButton]}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <>
                      <Ionicons name="time-outline" size={22} color="#fff" />
                      <ThemedText style={styles.buttonText}>Création...</ThemedText>
                    </>
                  ) : (
                    <>
                      <Ionicons name="hammer" size={22} color="#fff" />
                      <ThemedText style={styles.buttonText}>Créer l'enchère</ThemedText>
                    </>
                  )}
                </View>
              </ThemedButton>

              <Spacer height={15} />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.cancelButton}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="close-circle" size={22} color={theme.text} />
                  <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            <Spacer height={40} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Choisir une catégorie
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.id && styles.categoryItemActive
                  ]}
                  onPress={() => {
                    handleChange('category', category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.categoryItemLeft}>
                    <View style={[
                      styles.categoryIconContainer,
                      formData.category === category.id && styles.categoryIconContainerActive
                    ]}>
                      <Ionicons 
                        name={category.icon} 
                        size={22} 
                        color={formData.category === category.id ? '#fff' : Colors.primary} 
                      />
                    </View>
                    <ThemedText style={[
                      styles.categoryItemText,
                      formData.category === category.id && styles.categoryItemTextActive
                    ]}>
                      {category.label}
                    </ThemedText>
                  </View>
                  {formData.category === category.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.datePickerModalContent]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Choisir la date de fin
              </ThemedText>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity 
                  onPress={() => setShowDatePickerModal(false)}
                  style={styles.modalHeaderButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDateConfirm}
                  style={styles.modalHeaderButton}
                >
                  <Ionicons name="checkmark" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.selectedDateDisplay}>
              <ThemedText style={styles.selectedDateText}>
                {tempDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </ThemedText>
              <View style={styles.selectedTimeContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <ThemedText style={styles.selectedTimeText}>
                  {tempDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>
              <View style={styles.selectedDateBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <ThemedText style={styles.selectedDateBadgeText}>
                  Date sélectionnée
                </ThemedText>
              </View>
            </View>

            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
                <Ionicons name="chevron-back" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <ThemedText style={styles.monthYearText}>
                {months[currentMonth]} {currentYear}
              </ThemedText>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysOfWeekContainer}>
              {daysOfWeek.map(day => (
                <ThemedText key={day} style={styles.dayOfWeekText}>
                  {day}
                </ThemedText>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    item.empty && styles.calendarDayEmpty,
                    !item.empty && 
                    tempDate.getDate() === item.day && 
                    tempDate.getMonth() === currentMonth &&
                    tempDate.getFullYear() === currentYear && 
                    styles.calendarDaySelected
                  ]}
                  onPress={() => !item.empty && handleSelectDate(item.day)}
                  disabled={item.empty}
                >
                  {!item.empty && (
                    <ThemedText style={[
                      styles.calendarDayText,
                      tempDate.getDate() === item.day && 
                      tempDate.getMonth() === currentMonth &&
                      tempDate.getFullYear() === currentYear && 
                      styles.calendarDayTextSelected
                    ]}>
                      {item.day}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timePickerSection}>
              <ThemedText style={styles.timePickerTitle}>Choisir l'heure</ThemedText>
              
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerColumn}>
                  <TouchableOpacity 
                    style={styles.timePickerArrow}
                    onPress={() => handleHourChange(1)}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.timePickerValue}>
                    <ThemedText style={styles.timePickerValueText}>
                      {selectedHour.toString().padStart(2, '0')}
                    </ThemedText>
                  </View>
                  <TouchableOpacity 
                    style={styles.timePickerArrow}
                    onPress={() => handleHourChange(-1)}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <ThemedText style={styles.timePickerLabel}>Heure</ThemedText>
                </View>

                <View style={styles.timePickerSeparator}>
                  <ThemedText style={styles.timePickerSeparatorText}>:</ThemedText>
                </View>

                <View style={styles.timePickerColumn}>
                  <TouchableOpacity 
                    style={styles.timePickerArrow}
                    onPress={() => handleMinuteChange(1)}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.timePickerValue}>
                    <ThemedText style={styles.timePickerValueText}>
                      {selectedMinute.toString().padStart(2, '0')}
                    </ThemedText>
                  </View>
                  <TouchableOpacity 
                    style={styles.timePickerArrow}
                    onPress={() => handleMinuteChange(-1)}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <ThemedText style={styles.timePickerLabel}>Minute</ThemedText>
                </View>

                <View style={styles.timePickerAmPm}>
                  <TouchableOpacity 
                    style={[
                      styles.timePickerAmPmButton,
                      selectedAmPm === 'AM' && styles.timePickerAmPmButtonActive
                    ]}
                    onPress={() => handleAmPmChange('AM')}
                  >
                    <ThemedText style={[
                      styles.timePickerAmPmText,
                      selectedAmPm === 'AM' && styles.timePickerAmPmTextActive
                    ]}>
                      AM
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.timePickerAmPmButton,
                      selectedAmPm === 'PM' && styles.timePickerAmPmButtonActive
                    ]}
                    onPress={() => handleAmPmChange('PM')}
                  >
                    <ThemedText style={[
                      styles.timePickerAmPmText,
                      selectedAmPm === 'PM' && styles.timePickerAmPmTextActive
                    ]}>
                      PM
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 10,
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
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  imageScrollContainer: {
    position: 'relative',
  },
  imageScroll: {
    flexGrow: 0,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
    paddingRight: 20,
  },
  galleryButton: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  galleryButtonText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    color: Colors.primary,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.61)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputGroup: {
    gap: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#333',
  },
  textArea: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    color: '#333',
  },
  inputError: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  expirationSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  expirationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  expirationHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  durationScroll: {
    flexGrow: 0,
    marginBottom: 15,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  durationButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  daysBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  daysBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '80%',
  },
  datePickerModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalHeaderButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 5,
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
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  categoryItemText: {
    fontSize: 16,
  },
  categoryItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedDateDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  selectedTimeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 4,
  },
  selectedDateBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
    paddingHorizontal: 10,
  },
  monthNavButton: {
    padding: 10,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerSection: {
    marginTop: 1,
    marginBottom: 15,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    marginTop:'-100'
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  timePickerColumn: {
    alignItems: 'center',
    width: 70,
  },
  timePickerArrow: {
    padding: 5,
  },
  timePickerValue: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 4,
  },
  timePickerValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  timePickerSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  timePickerSeparatorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  timePickerAmPm: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  timePickerAmPmButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 2,
  },
  timePickerAmPmButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePickerAmPmText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timePickerAmPmTextActive: {
    color: '#fff',
  },
  timePickerLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonsContainer: {
    paddingHorizontal: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
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
    alignItems: 'center',
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