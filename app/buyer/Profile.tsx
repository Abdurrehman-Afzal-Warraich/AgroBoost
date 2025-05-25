import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfilePicture from '../components/ProfilePicture';
import { my_auth } from '../../firebaseConfig';
import { useBuyer } from './hooks/fetch_buyer';
import { useUpdateBuyerDetails } from './hooks/useUpdateBuyerDetails';
import { Picker } from '@react-native-picker/picker';

const cityOptions = [
  { label: 'Select City', value: '' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Faisalabad', value: 'Faisalabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
  { label: 'Gujranwala', value: 'Gujranwala' },
  { label: 'Multan', value: 'Multan' },
  { label: 'Sargodha', value: 'Sargodha' },
  { label: 'Sialkot', value: 'Sialkot' },
  { label: 'Bahawalpur', value: 'Bahawalpur' },
  { label: 'Sahiwal', value: 'Sahiwal' },
  { label: 'Sheikhupura', value: 'Sheikhupura' },
  { label: 'Jhang', value: 'Jhang' },
  { label: 'Rahim Yar Khan', value: 'Rahim Yar Khan' },
  { label: 'Kasur', value: 'Kasur' },
  { label: 'Okara', value: 'Okara' },
];

const BuyerProfile = () => {
  const { t, i18n } = useTranslation();
  const { userName, email, city } = useUser();
  const { profileData, updateProfilePicture } = useBuyer();
  const { updateBuyerDetails, loading: updating } = useUpdateBuyerDetails();

  const handleImageUpdated = (url: string) => {
    updateProfilePicture(url);
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: profileData.businessName || '',
    phoneNumber: profileData.phoneNumber ? (profileData.phoneNumber.startsWith('+92') ? profileData.phoneNumber.substring(3) : profileData.phoneNumber) : '',
    city: profileData.address || '',
  });

  React.useEffect(() => {
    setUpdateForm({
      name: profileData.businessName || '',
      phoneNumber: profileData.phoneNumber ? (profileData.phoneNumber.startsWith('+92') ? profileData.phoneNumber.substring(3) : profileData.phoneNumber) : '',
      city: profileData.address || '',
    });
  }, [profileData]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phoneNumber') {
      const numericValue = value.replace(/[^0-9]/g, '').substring(0, 10);
      setUpdateForm(f => ({ ...f, phoneNumber: numericValue }));
    } else {
      setUpdateForm(f => ({ ...f, [field]: value }));
    }
  };

  const handleUpdatePress = () => setShowUpdateModal(true);
  const handleCancel = () => setShowUpdateModal(false);
  const handleSave = async () => {
    if (!updateForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!updateForm.phoneNumber || !/^\d{10}$/.test(updateForm.phoneNumber)) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
    }
    if (!updateForm.city) {
      Alert.alert('Error', 'City is required');
      return;
    }
    await updateBuyerDetails({
      name: updateForm.name,
      phoneNumber: `+92${updateForm.phoneNumber}`,
      city: updateForm.city,
    });
    setShowUpdateModal(false);
  };

  if (profileData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('Loading profile...')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          <ProfilePicture
            imageUrl={profileData.profilePicture}
            userId={my_auth.currentUser?.uid || ''}
            userType="buyer"
            onImageUpdated={handleImageUpdated}
          />
          <TouchableOpacity style={styles.updateIcon} onPress={handleUpdatePress}>
          <MaterialCommunityIcons name="pencil-circle" size={32} color="#4CAF50" />
        </TouchableOpacity>
          <Text style={[styles.name, i18n.language === 'ur' && styles.urduText]}>
            {profileData.name || t('Name')}
          </Text>
          <Text style={[styles.role, i18n.language === 'ur' && styles.urduText]}>
            {profileData.businessName || t('Buyer')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.detailsCard}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.transactions}</Text>
            <Text style={styles.statLabel}>{t('Transactions')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.coins}</Text>
            <Text style={styles.statLabel}>{t('Coins')}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Phone')}</Text>
              <Text style={styles.infoValue}>{profileData.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Email')}</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('City')}</Text>
              <Text style={styles.infoValue}>{profileData.city || t('Not specified')}</Text>
            </View>
          </View>
        </View>
        
      </ScrollView>
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Profile</Text>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Name"
              value={updateForm.name}
              onChangeText={text => handleInputChange('name', text)}
            />
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#333', fontWeight: '600', backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, paddingRight: 5 }}>+92</Text>
              <TextInput
                style={[styles.textInput, { flex: 1, marginLeft: 5, marginBottom: 0 }]}
                placeholder="Enter 10 digit number"
                value={updateForm.phoneNumber}
                onChangeText={text => handleInputChange('phoneNumber', text)}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <Text style={styles.inputLabel}>City *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={updateForm.city}
                onValueChange={val => handleInputChange('city', val)}
              >
                {cityOptions.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
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
  updateIcon: {
    position: 'absolute',
    top: -4,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#333333',
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    marginBottom: 15,
    overflow: 'hidden',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  inputLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
    fontWeight: '500',
  },
});

export default BuyerProfile;