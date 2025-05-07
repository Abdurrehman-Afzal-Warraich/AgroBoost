import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Button } from 'react-native-elements';
import CustomHeader from '../../components/CustomHeader';
import * as ImagePicker from 'expo-image-picker';

interface FormData {
  pestType: string;
  severity: string;
  area: string;
  cropStage: string;
  image?: string;
}

const PestControl = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    pestType: '',
    severity: '',
    area: '',
    cropStage: '',
  });

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleSubmit = async () => {
    if (!formData.pestType || !formData.severity || !formData.area || !formData.cropStage) {
      Alert.alert(
        t('Error'),
        t('agribot.pestControl.errors.allFieldsRequired'),
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Here you would make the API call to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      Alert.alert(
        t('Success'),
        t('agribot.pestControl.success'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        t('Error'),
        t('agribot.pestControl.errors.submissionFailed'),
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('agribot.pestControl.title')}</Text>
        
        {/* Pest Type Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('agribot.pestControl.pestType')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.pestType}
              onValueChange={(value) => setFormData({ ...formData, pestType: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('agribot.pestControl.pestType')} value="" />
              {Object.entries(t('agribot.pestControl.pestOptions', { returnObjects: true }))
                .map(([key, value]) => (
                  <Picker.Item key={key} label={value} value={key} />
                ))}
            </Picker>
          </View>
        </View>

        {/* Severity Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('agribot.pestControl.severity')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('agribot.pestControl.severity')} value="" />
              {Object.entries(t('agribot.pestControl.severityOptions', { returnObjects: true }))
                .map(([key, value]) => (
                  <Picker.Item key={key} label={value} value={key} />
                ))}
            </Picker>
          </View>
        </View>

        {/* Area Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('agribot.pestControl.area')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.area}
              onValueChange={(value) => setFormData({ ...formData, area: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('agribot.pestControl.area')} value="" />
              {Object.entries(t('agribot.pestControl.areaOptions', { returnObjects: true }))
                .map(([key, value]) => (
                  <Picker.Item key={key} label={value} value={key} />
                ))}
            </Picker>
          </View>
        </View>

        {/* Crop Stage Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('agribot.cropAdvice.growthStage')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.cropStage}
              onValueChange={(value) => setFormData({ ...formData, cropStage: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('agribot.cropAdvice.growthStage')} value="" />
              {Object.entries(t('agribot.cropAdvice.growthStageOptions', { returnObjects: true }))
                .map(([key, value]) => (
                  <Picker.Item key={key} label={value} value={key} />
                ))}
            </Picker>
          </View>
        </View>

        {/* Image Upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Upload Image (Optional)</Text>
          <TouchableOpacity 
            style={styles.imageUploadButton} 
            onPress={handleImagePick}
          >
            {formData.image ? (
              <Image 
                source={{ uri: formData.image }} 
                style={styles.previewImage} 
              />
            ) : (
              <Text style={styles.imageUploadText}>+ Add Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <Button
          title={loading ? t('agribot.loading') : t('agribot.submit')}
          onPress={handleSubmit}
          disabled={loading}
          buttonStyle={styles.submitButton}
          titleStyle={styles.submitButtonText}
          containerStyle={styles.submitButtonContainer}
        />
        {loading && <ActivityIndicator style={styles.loader} color="#4CAF50" />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  picker: {
    height: 50,
  },
  imageUploadButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageUploadText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#FFC107',
    borderRadius: 25,
    height: 50,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#1B5E20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default PestControl; 