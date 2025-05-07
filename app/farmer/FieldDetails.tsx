import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Button } from 'react-native-elements';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { db, my_auth } from '../../firebaseConfig';
import { useFarmer } from '../hooks/fetch_farmer';


import { useFields, FieldData } from '../hooks/useFields';
import Toast from '../components/Toast';

interface FieldFormData {
  cropType: string;
  soilType: string;
  sowingDate: Date;
  areaInAcres: string;
  latitude: number | null;
  longitude: number | null;
}

const FieldDetails = () => {
  const { t, i18n } = useTranslation();
  const { fields, loading, error, addField } = useFields();
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<number | null>(null);
  const { farmerData , loading: farmerLoading} = useFarmer();

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [formFields, setFormFields] = useState<FieldFormData[]>([{
    cropType: '',
    soilType: '',
    sowingDate: new Date(),
    areaInAcres: '',
    latitude: null,
    longitude: null,
  }]);

  // Add new state for date inputs
  const [dateInputs, setDateInputs] = useState<{ day: string; month: string; year: string }[]>([{
    day: '',
    month: '',
    year: ''
  }]);

  // Update dateInputs when formFields change
  useEffect(() => {
    console.log("Farmer Data",farmerData);
    setDateInputs(formFields.map(field => ({
      day: field.sowingDate.getDate().toString(),
      month: (field.sowingDate.getMonth() + 1).toString(),
      year: field.sowingDate.getFullYear().toString()

    })));
  }, [formFields.length]);

  useEffect(() => {
    console.log('Farmer Data:', farmerData);
  }, [farmerData]);

  const updateDateField = (index: number, field: 'day' | 'month' | 'year', value: string) => {
    const newDateInputs = [...dateInputs];
    newDateInputs[index] = { ...newDateInputs[index], [field]: value };
    setDateInputs(newDateInputs);

    // Only update the actual date if all fields have valid numbers
    const { day, month, year } = newDateInputs[index];
    if (day && month && year) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (!isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
        const newDate = new Date(formFields[index].sowingDate);
        newDate.setDate(Math.min(Math.max(1, dayNum), 31));
        newDate.setMonth(Math.min(Math.max(0, monthNum - 1), 11));
        newDate.setFullYear(Math.max(2000, yearNum));
        updateFieldForm(index, 'sowingDate', newDate);
      }
    }
  };

  const cropTypes = ['Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Other'];
  const soilTypes = ['Loam', 'Clay loam'];

  const handleLocationPermission = async (index: number) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      const updatedFields = [...formFields];
      updatedFields[index] = {
        ...updatedFields[index],
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setFormFields(updatedFields);
    }
  };

  const handleDateChange = (index: number, event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      const updatedFields = [...formFields];
      updatedFields[index] = {
        ...updatedFields[index],
        sowingDate: selectedDate,
      };
      setFormFields(updatedFields);
    }
  };

  const addFieldForm = () => {
    setFormFields([...formFields, {
      cropType: '',
      soilType: '',
      sowingDate: new Date(),
      areaInAcres: '',
      latitude: null,
      longitude: null,
    }]);
  };

  const removeFieldForm = (index: number) => {
    if (formFields.length > 1) {
      const updatedFields = formFields.filter((_, i) => i !== index);
      setFormFields(updatedFields);
    }
  };

  const updateFieldForm = (index: number, field: string, value: any) => {
    const updatedFields = [...formFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFormFields(updatedFields);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const handleSubmit = async () => {
    const invalidFields = formFields.some(field => 
      !field.cropType || !field.soilType || !field.areaInAcres
    );

    if (invalidFields) {
      showToast(t('fieldDetails.error.fillRequired'), 'error');
      return;
    }

    setIsSaving(true);
    try {
      let allSuccess = true;
      for (const field of formFields) {
        const success = await addField(field);
        if (!success) {
          allSuccess = false;
          break;
        }
      }

      if (allSuccess) {
        showToast(t('fieldDetails.success'), 'success');
        setShowForm(false);
        setFormFields([{
          cropType: '',
          soilType: '',
          sowingDate: new Date(),
          areaInAcres: '',
          latitude: null,
          longitude: null,
        }]);
      } else {
        showToast(t('fieldDetails.error.someFailed'), 'error');
      }
    } catch (error) {
      console.error('Error saving field data:', error);
      showToast(t('fieldDetails.error.saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const FieldCard = ({ field }: { field: FieldData }) => (
    <View style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <MaterialCommunityIcons name="sprout" size={24} color="#4CAF50" />
        <Text style={styles.fieldTitle}>{field.cropType}</Text>
      </View>
      
      <View style={styles.fieldDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="sprout" size={20} color="#666" />
          <Text style={styles.detailText}>{field.soilType}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar" size={20} color="#666" />
          <Text style={styles.detailText}>
            {field.sowingDate.toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="ruler" size={20} color="#666" />
          <Text style={styles.detailText}>{field.areaInAcres} acres</Text>
        </View>
        
        {field.latitude && field.longitude && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
            <Text style={styles.detailText}>
              {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && !isSaving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!showForm ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('fieldDetails.yourFields')}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowForm(true)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>{t('fieldDetails.addFields')}</Text>
              </TouchableOpacity>
            </View>

            {fields.length > 0 ? (
              fields.map(field => (
                <FieldCard key={field.id} field={field} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="sprout-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>{t('fieldDetails.noFields')}</Text>
                <Button
                  title={t('fieldDetails.addFirstField')}
                  onPress={() => setShowForm(true)}
                  buttonStyle={styles.addFirstButton}
                  titleStyle={styles.addFirstButtonText}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{t('fieldDetails.addNewFields')}</Text>
            
            {formFields.map((field, index) => (
              <View key={index} style={styles.fieldForm}>
                <View style={styles.fieldFormHeader}>
                  <Text style={styles.fieldFormTitle}>{t('fieldDetails.field')}</Text>
                  {formFields.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeFieldForm(index)}
                      style={styles.removeFieldButton}
                    >
                      <MaterialCommunityIcons name="close" size={24} color="#FF5252" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('fieldDetails.cropType')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={field.cropType}
                      onValueChange={(value) => updateFieldForm(index, 'cropType', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('fieldDetails.selectCropType')} value="" />
                      {cropTypes.map((crop, i) => (
                        <Picker.Item key={i} label={crop} value={crop} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('fieldDetails.soilType')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={field.soilType}
                      onValueChange={(value) => updateFieldForm(index, 'soilType', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('fieldDetails.selectSoilType')} value="" />
                      {soilTypes.map((soil, i) => (
                        <Picker.Item key={i} label={soil} value={soil} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('fieldDetails.sowingDate')}</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={[styles.dateInput, styles.dateInputDay]}
                      placeholder="DD"
                      keyboardType="numeric"
                      maxLength={2}
                      value={dateInputs[index].day}
                      onChangeText={(text) => updateDateField(index, 'day', text)}
                    />
                    <Text style={styles.dateSeparator}>/</Text>
                    <TextInput
                      style={[styles.dateInput, styles.dateInputMonth]}
                      placeholder="MM"
                      keyboardType="numeric"
                      maxLength={2}
                      value={dateInputs[index].month}
                      onChangeText={(text) => updateDateField(index, 'month', text)}
                    />
                    <Text style={styles.dateSeparator}>/</Text>
                    <TextInput
                      style={[styles.dateInput, styles.dateInputYear]}
                      placeholder="YYYY"
                      keyboardType="numeric"
                      maxLength={4}
                      value={dateInputs[index].year}
                      onChangeText={(text) => updateDateField(index, 'year', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('fieldDetails.areaInAcres')}</Text>
                  <TextInput
                    style={styles.input}
                    value={field.areaInAcres}
                    onChangeText={(text) => updateFieldForm(index, 'areaInAcres', text)}
                    keyboardType="numeric"
                    placeholder={t('fieldDetails.enterArea')}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('fieldDetails.location')}</Text>
                  <Button
                    title={t('fieldDetails.getCurrentLocation')}
                    onPress={() => handleLocationPermission(index)}
                    buttonStyle={styles.locationButton}
                    titleStyle={styles.locationButtonText}
                  />
                  {field.latitude && field.longitude && (
                    <Text style={styles.locationText}>
                      {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <Button
              title={t('fieldDetails.addAnotherField')}
              onPress={addFieldForm}
              buttonStyle={styles.addAnotherButton}
              titleStyle={styles.addAnotherButtonText}
              containerStyle={styles.addAnotherButtonContainer}
              icon={<MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" style={{ marginRight: 5 }} />}
            />

            <View style={styles.buttonContainer}>
              <Button
                title={t('fieldDetails.cancel')}
                onPress={() => {
                  setShowForm(false);
                  setFormFields([{
                    cropType: '',
                    soilType: '',
                    sowingDate: new Date(),
                    areaInAcres: '',
                    latitude: null,
                    longitude: null,
                  }]);
                }}
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelButtonText}
                containerStyle={styles.buttonWrapper}
                disabled={isSaving}
              />
              <Button
                title={t('fieldDetails.saveFields')}
                onPress={handleSubmit}
                loading={isSaving}
                disabled={isSaving}
                buttonStyle={styles.saveButton}
                titleStyle={styles.saveButtonText}
                containerStyle={styles.buttonWrapper}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
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
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 10,
  },
  fieldDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  locationText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#DDDDDD',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fieldForm: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  fieldFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fieldFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  removeFieldButton: {
    padding: 5,
  },
  addAnotherButton: {
    backgroundColor: '#81C784',
    borderRadius: 8,
    marginBottom: 20,
  },
  addAnotherButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addAnotherButtonContainer: {
    marginTop: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  dateInput: {
    fontSize: 16,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  dateInputDay: {
    width: 50,
  },
  dateInputMonth: {
    width: 50,
  },
  dateInputYear: {
    width: 70,
  },
  dateSeparator: {
    fontSize: 16,
    color: '#666666',
    marginHorizontal: 5,
  },
});

export default FieldDetails;