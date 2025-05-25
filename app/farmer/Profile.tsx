import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ProfilePicture from '../components/ProfilePicture';
import { useProfileImage } from '../hooks/useProfileImage';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, my_auth } from '../../firebaseConfig';
import { useFarmer } from '../hooks/fetch_farmer';
import { useUpdateFarmer } from '../hooks/useUpdateFarmer';

interface FarmerData {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  budget: string;
  coins: number;
  profilePicture?: string;
}

interface UpdateFormData {
  name: string;
  phoneNumber: string;
  city: string;
  budget: string;
}

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { userName, email, city } = useUser();
  const { farmerData, loading: farmerLoading, refetchFarmer } = useFarmer();
  const { updateFarmer, loading: updateLoading } = useUpdateFarmer();
  const [consultations, setConsultations] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updateFormData, setUpdateFormData] = useState<UpdateFormData>({
    name: '',
    phoneNumber: '',
    city: '',
    budget: ''
  });
  
  const { imageUrl, loading: imageLoading, uploadImage } = useProfileImage(
    my_auth.currentUser?.uid || '',
    'farmer'
  );

  // Budget options
  const budgetOptions = [
    { label: t("Select Budget"), value: "" },
    { label: t("Under 50,000 PKR"), value: "Under 50,000 PKR" },
    { label: t("50,000 - 100,000 PKR"), value: "50,000 - 100,000 PKR" },
    { label: t("100,000 - 200,000 PKR"), value: "100,000 - 200,000 PKR" },
    { label: t("Above 200,000 PKR"), value: "Above 200,000 PKR" },
  ];

  // City options
  const cityOptions = [
    { label: t("Select City"), value: "" },
    { label: t("Lahore"), value: "Lahore" },
    { label: t("Faisalabad"), value: "Faisalabad" },
    { label: t("Rawalpindi"), value: "Rawalpindi" },
    { label: t("Gujranwala"), value: "Gujranwala" },
    { label: t("Multan"), value: "Multan" },
    { label: t("Sargodha"), value: "Sargodha" },
    { label: t("Sialkot"), value: "Sialkot" },
    { label: t("Bahawalpur"), value: "Bahawalpur" },
    { label: t("Sahiwal"), value: "Sahiwal" },
    { label: t("Sheikhupura"), value: "Sheikhupura" },
    { label: t("Jhang"), value: "Jhang" },
    { label: t("Rahim Yar Khan"), value: "Rahim Yar Khan" },
    { label: t("Kasur"), value: "Kasur" },
    { label: t("Okara"), value: "Okara" },
  ];
  
  const getFarmerConsultationCount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const consultationsRef = collection(db, "consultations");
      const q = query(
        consultationsRef, 
        where("farmerId", "==", user.uid), 
        where("status", "==", "active")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          setConsultations(snapshot.size);
        },
        (error: Error) => {
          console.error("Error fetching consultations:", error);
        }
      );

      return () => unsubscribe();
    }
  };

  // Pull-to-refresh handler with actual data refetch
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Starting refresh...');
      
      // Refetch farmer data from Firebase
      if (refetchFarmer) {
        await refetchFarmer();
        console.log('Farmer data refetched');
      }
      
      // Refresh consultations count
      await getFarmerConsultationCount();
      console.log('Consultations count refreshed');
      
      // Add a small delay to show the refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert(t('Error'), t('Failed to refresh profile data'));
    } finally {
      setRefreshing(false);
      console.log('Refresh completed');
    }
  }, [refetchFarmer, t]);

  useEffect(() => {
    getFarmerConsultationCount();
    console.log('Farmer Data:', farmerData);
    
    // Initialize form data when farmer data is loaded
    if (farmerData) {
      // Extract phone number without +92 prefix for editing
      const phoneWithoutPrefix = farmerData.phoneNumber?.startsWith('+92') 
        ? farmerData.phoneNumber.substring(3) 
        : farmerData.phoneNumber || '';

      setUpdateFormData({
        name: farmerData.name || '',
        phoneNumber: phoneWithoutPrefix,
        city: farmerData.city || '',
        budget: farmerData.budget || ''
      });
    }
  }, [farmerData]);

  const handleImageUpdated = async () => {
    await uploadImage();
  };

  const handleUpdatePress = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      const userId = my_auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(t('Error'), t('User not authenticated'));
        return;
      }

      // Validate required fields
      if (!updateFormData.name.trim()) {
        Alert.alert(t('Error'), t('Name is required'));
        return;
      }

      // Validate phone number (should be exactly 10 digits)
      if (updateFormData.phoneNumber && !/^\d{10}$/.test(updateFormData.phoneNumber)) {
        Alert.alert(t('Error'), t('Phone number must be exactly 10 digits'));
        return;
      }

      // Prepare data with +92 prefix for phone number
      const dataToUpdate = {
        ...updateFormData,
        phoneNumber: updateFormData.phoneNumber ? `+92${updateFormData.phoneNumber}` : ''
      };

      await updateFarmer(userId, dataToUpdate);
      
      // Refetch the data to show updates immediately
      if (refetchFarmer) {
        await refetchFarmer();
      }
      
      setShowUpdateModal(false);
      Alert.alert(t('Success'), t('Profile updated successfully'));
    } catch (error) {
      console.error('Error updating farmer:', error);
      Alert.alert(t('Error'), t('Failed to update profile'));
    }
  };

  const handleInputChange = (field: keyof UpdateFormData, value: string) => {
    if (field === 'phoneNumber') {
      // Only allow digits and limit to 10 characters
      const numericValue = value.replace(/[^0-9]/g, '').substring(0, 10);
      setUpdateFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      setUpdateFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (farmerLoading || imageLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>{t('Loading profile...')}</Text>
      </View>
    );
  }

  if (!farmerData) {
    return (
      <View style={styles.loaderContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color="#999" />
        <Text style={styles.noDataText}>{t('No farmer data found')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>{t('Retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']} // Android
          tintColor="#4CAF50" // iOS
          title={t('Pull to refresh')} // iOS
          titleColor="#4CAF50" // iOS
        />
      }
    >
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          <ProfilePicture
            imageUrl={imageUrl || farmerData?.profilePicture || ''}
            userId={my_auth.currentUser?.uid || ''}
            userType="farmer"
            onImageUpdated={handleImageUpdated}
          />
          <Text style={[styles.name, i18n.language === 'ur' && styles.urduText]}>
            {farmerData?.name || ''}
          </Text>
          <Text style={[styles.role, i18n.language === 'ur' && styles.urduText]}>
            {t('Farmer')}
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        {/* Update Icon */}
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdatePress}
          disabled={updateLoading}
        >
          <MaterialCommunityIcons 
            name="pencil-circle" 
            size={32} 
            color="#4CAF50" 
          />
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{farmerData?.coins || 0}</Text>
            <Text style={styles.statLabel}>{t('Coins')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{consultations || 0}</Text>
            <Text style={styles.statLabel}>{t('Consultations')}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Phone')}</Text>
              <Text style={styles.infoValue}>{farmerData?.phoneNumber || ''}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Email')}</Text>
              <Text style={styles.infoValue}>{farmerData?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('City')}</Text>
              <Text style={styles.infoValue}>{farmerData?.city || ''}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Budget')}</Text>
              <Text style={styles.infoValue}>{farmerData?.budget || ''}</Text>
            </View>
          </View>
        </View>

        
      </View>

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Update Profile')}</Text>
              <TouchableOpacity
                onPress={() => setShowUpdateModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Name')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={updateFormData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder={t('Enter your name')}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Phone Number')}</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+92</Text>
                  <TextInput
                    style={styles.phoneInput}
                    value={updateFormData.phoneNumber}
                    onChangeText={(value) => handleInputChange('phoneNumber', value)}
                    placeholder={t('Enter 10 digit number')}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.helperText}>{t('Enter exactly 10 digits')}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('City')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={updateFormData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    style={styles.picker}
                  >
                    {cityOptions.map((option) => (
                      <Picker.Item 
                        key={option.value} 
                        label={option.label} 
                        value={option.value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Budget')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={updateFormData.budget}
                    onValueChange={(value) => handleInputChange('budget', value)}
                    style={styles.picker}
                  >
                    {budgetOptions.map((option) => (
                      <Picker.Item 
                        key={option.value} 
                        label={option.label} 
                        value={option.value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, updateLoading && styles.disabledButton]}
                onPress={handleUpdateSubmit}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileSection: {
    padding: 20,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  role: {
    fontSize: 18,
    color: '#E8F5E9',
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 8,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  updateButton: {
    position: 'absolute',
    top: 2,
    right: 6,
    zIndex: 1,
    backgroundColor: '#F0F8F0',
    borderRadius: 20,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 15,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    margin: 2
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  infoSection: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  refreshHintText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginTop: 2,
  },
  urduText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
    flexGrow: 1,
    overflow: 'scroll',
    marginBottom: 30,
    maxHeight: 600,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#333333',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
  },
  phonePrefix: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    paddingLeft: 12,
    paddingRight: 5,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333333',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
});

export default Profile;