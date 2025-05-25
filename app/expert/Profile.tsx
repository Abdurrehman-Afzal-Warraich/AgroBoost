import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfilePicture from '../components/ProfilePicture';
import { my_auth } from '../../firebaseConfig';

import { useExpert } from './hooks/fetch_expert';
import { useUpdateExpertDetails } from './hooks/useUpdateExpertDetails';
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
const experienceOptions = [
  { label: 'Select Experience', value: '' },
  { label: '1 year', value: '1' },
  { label: '2 years', value: '2' },
  { label: '3 years', value: '3' },
  { label: '4 years', value: '4' },
  { label: '5 years', value: '5' },
  { label: 'More than 5 years', value: '5+' },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { userName, email, city } = useUser();
  const { profileData, updateProfilePicture } = useExpert();
  const { updateExpertDetails, loading: updating, error } = useUpdateExpertDetails();
  console.log('Profile Data:', profileData);

  const handleImageUpdated = (url: string) => {
    updateProfilePicture(url);
  }; 

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: profileData.name || '',
    phoneNumber: profileData.phoneNumber ? (profileData.phoneNumber.startsWith('+92') ? profileData.phoneNumber.substring(3) : profileData.phoneNumber) : '',
    city: profileData.city || '',
    experience: profileData.experience ? String(profileData.experience) : '',
    consultationHours: {
      start: typeof profileData.consultationHours === 'object' ? profileData.consultationHours.start || '' : '',
      end: typeof profileData.consultationHours === 'object' ? profileData.consultationHours.end || '' : '',
    },
  });

  React.useEffect(() => {
    setUpdateForm({
      name: profileData.name || '',
      phoneNumber: profileData.phoneNumber ? (profileData.phoneNumber.startsWith('+92') ? profileData.phoneNumber.substring(3) : profileData.phoneNumber) : '',
      city: profileData.city || '',
      experience: profileData.experience ? String(profileData.experience) : '',
      consultationHours: {
        start: typeof profileData.consultationHours === 'object' ? profileData.consultationHours.start || '' : '',
        end: typeof profileData.consultationHours === 'object' ? profileData.consultationHours.end || '' : '',
      },
    });
  }, [profileData]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phoneNumber') {
      // Only allow digits and limit to 10 characters
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
    if (!updateForm.experience) {
      Alert.alert('Error', 'Experience is required');
      return;
    }
    if (!updateForm.consultationHours.start || !updateForm.consultationHours.end) {
      Alert.alert('Error', 'Consultation hours are required');
      return;
    }
    await updateExpertDetails({
      ...updateForm,
      phoneNumber: `+92${updateForm.phoneNumber}`,
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
    <>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <ProfilePicture
              imageUrl={profileData.profilePicture}
              userId={my_auth.currentUser?.uid || ''}
              userType="expert"
              onImageUpdated={handleImageUpdated}
            />
            <Text style={[styles.name, i18n.language === 'ur' && styles.urduText]}>
              {profileData.name || userName}
            </Text>
            <Text style={[styles.role, i18n.language === 'ur' && styles.urduText]}>
              {profileData.specialization || t('Expert')}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t('Rating')}</Text>
            </View> 
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileData?.consultations || 0}</Text>
              <Text style={styles.statLabel}>{t('Consultations')}</Text>
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
                <Text style={styles.infoLabel}>{t('phoneNumber')}</Text>
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

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="briefcase-outline" size={24} color="#4CAF50" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Experience')}</Text>
                <Text style={styles.infoValue}>{profileData?.experience || t('Not specified')} {t('years')}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#4CAF50" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Consultation Hours')}</Text>
                <Text style={styles.infoValue}>
                  {typeof profileData.consultationHours === 'object' && 
                   'start' in profileData.consultationHours && 
                   'end' in profileData.consultationHours
                    ? `${profileData.consultationHours.start} - ${profileData.consultationHours.end}`
                    : typeof profileData.consultationHours === 'string'
                      ? profileData.consultationHours
                      : t('Not specified')}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="star-outline" size={24} color="#4CAF50" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Total Ratings')}</Text>
                <Text style={styles.infoValue}>{profileData.rating}</Text>
              </View>
            </View>

            
          </View>
        </View>
        <TouchableOpacity style={styles.updateIcon} onPress={handleUpdatePress}>
          <MaterialCommunityIcons name="pencil-circle" size={32} color="#4CAF50" />
        </TouchableOpacity>
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
            <Text style={styles.inputLabel}>Experience Years *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={updateForm.experience}
                onValueChange={val => handleInputChange('experienceYears', val)}
              >
                {experienceOptions.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
            <Text style={styles.inputLabel}>Consultation Start *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Consultation Start (e.g. 09:00)"
              value={updateForm.consultationHours.start}
              onChangeText={text => setUpdateForm(f => ({ ...f, consultationHours: { ...f.consultationHours, start: text } }))}
            />
            <Text style={styles.inputLabel}>Consultation End *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Consultation End (e.g. 17:00)"
              value={updateForm.consultationHours.end}
              onChangeText={text => setUpdateForm(f => ({ ...f, consultationHours: { ...f.consultationHours, end: text } }))}
            />
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
    </>
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
    justifyContent: 'space-between',
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
    top: 10,
    right: 10,
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

export default Profile;