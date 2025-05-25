import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';

const ChangePinCode = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = getAuth();
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // Refs for auto-focus
  const newPinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  const validatePin = (pin: string) => {
    return /^\d{6}$/.test(pin);
  };

  const handleCurrentPinChange = (text: string) => {
    // Only allow digits and limit to 6 characters
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 6);
    setCurrentPin(numericText);
    
    // Auto-focus to next field when 6 digits are entered
    if (numericText.length === 6) {
      newPinRef.current?.focus();
    }
  };

  const handleNewPinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 6);
    setNewPin(numericText);
    
    if (numericText.length === 6) {
      confirmPinRef.current?.focus();
    }
  };

  const handleConfirmPinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 6);
    setConfirmPin(numericText);
  };

  const verifyCurrentPin = async (enteredPin: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const farmerRef = doc(db, 'farmer', userId);
      const farmerSnap = await getDoc(farmerRef);

      if (!farmerSnap.exists()) {
        throw new Error('Farmer data not found');
      }

      const farmerData = farmerSnap.data();
      const storedPin = "123456"

      return storedPin === enteredPin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      throw error;
    }
  };

  const updatePinInDatabase = async (newPinCode: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const farmerRef = doc(db, 'farmer', userId);
      await updateDoc(farmerRef, {
        pinCode: newPinCode,
        pin: newPinCode, // Update both fields for compatibility
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating PIN:', error);
      throw error;
    }
  };

  const handleChangePinCode = async () => {
    try {
      // Validate all fields
      if (!currentPin || !newPin || !confirmPin) {
        Alert.alert(t('Error'), t('Please fill all fields'));
        return;
      }

      if (!validatePin(currentPin)) {
        Alert.alert(t('Error'), t('Current PIN must be exactly 6 digits'));
        return;
      }

      if (!validatePin(newPin)) {
        Alert.alert(t('Error'), t('New PIN must be exactly 6 digits'));
        return;
      }

      if (!validatePin(confirmPin)) {
        Alert.alert(t('Error'), t('Confirm PIN must be exactly 6 digits'));
        return;
      }

      if (newPin !== confirmPin) {
        Alert.alert(t('Error'), t('New PIN and Confirm PIN do not match'));
        return;
      }

      if (currentPin === newPin) {
        Alert.alert(t('Error'), t('New PIN must be different from current PIN'));
        return;
      }

      setLoading(true);

      // Verify current PIN
      const isCurrentPinValid = await verifyCurrentPin(currentPin);
      if (!isCurrentPinValid) {
        Alert.alert(t('Error'), t('Current PIN is incorrect'));
        return;
      }

      // Update PIN in database
      await updatePinInDatabase(newPin);

      Alert.alert(
        t('Success'),
        t('PIN code has been changed successfully'),
        [
          {
            text: t('OK'),
            onPress: () => {
              // Clear form and go back
              setCurrentPin('');
              setNewPin('');
              setConfirmPin('');
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error changing PIN:', error);
      Alert.alert(t('Error'), t('Failed to change PIN code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const renderPinInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPin: boolean,
    toggleShow: () => void,
    ref?: React.RefObject<TextInput>
  ) => (
    <View style={styles.inputContainer}>
      <TextInput
        ref={ref}
        style={styles.pinInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry={!showPin}
        textAlign="center"
        fontSize={18}
        letterSpacing={8}
      />
      <TouchableOpacity style={styles.eyeButton} onPress={toggleShow}>
        <MaterialCommunityIcons
          name={showPin ? 'eye-off' : 'eye'}
          size={24}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Change PIN Code')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-reset" size={64} color="#4CAF50" />
          </View>

          <Text style={styles.description}>
            {t('Enter your current PIN and create a new 6-digit PIN code')}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('Current PIN Code')} *</Text>
            {renderPinInput(
              currentPin,
              handleCurrentPinChange,
              t('Enter current PIN'),
              showCurrentPin,
              () => setShowCurrentPin(!showCurrentPin)
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('New PIN Code')} *</Text>
            {renderPinInput(
              newPin,
              handleNewPinChange,
              t('Enter new PIN'),
              showNewPin,
              () => setShowNewPin(!showNewPin),
              newPinRef
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('Confirm New PIN Code')} *</Text>
            {renderPinInput(
              confirmPin,
              handleConfirmPinChange,
              t('Confirm new PIN'),
              showConfirmPin,
              () => setShowConfirmPin(!showConfirmPin),
              confirmPinRef
            )}
          </View>

          <View style={styles.pinRequirements}>
            <Text style={styles.requirementsTitle}>{t('PIN Requirements:')}</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={validatePin(newPin) ? 'check-circle' : 'circle-outline'}
                size={16}
                color={validatePin(newPin) ? '#4CAF50' : '#999'}
              />
              <Text style={[
                styles.requirementText,
                validatePin(newPin) && styles.requirementMet
              ]}>
                {t('Must be exactly 6 digits')}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={newPin === confirmPin && newPin.length === 6 ? 'check-circle' : 'circle-outline'}
                size={16}
                color={newPin === confirmPin && newPin.length === 6 ? '#4CAF50' : '#999'}
              />
              <Text style={[
                styles.requirementText,
                newPin === confirmPin && newPin.length === 6 && styles.requirementMet
              ]}>
                {t('PIN confirmation must match')}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={currentPin !== newPin && newPin.length === 6 ? 'check-circle' : 'circle-outline'}
                size={16}
                color={currentPin !== newPin && newPin.length === 6 ? '#4CAF50' : '#999'}
              />
              <Text style={[
                styles.requirementText,
                currentPin !== newPin && newPin.length === 6 && styles.requirementMet
              ]}>
                {t('Must be different from current PIN')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.changeButton, loading && styles.disabledButton]}
            onPress={handleChangePinCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-check" size={20} color="#FFFFFF" />
                <Text style={styles.changeButtonText}>{t('Change PIN Code')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  pinRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
});

export default ChangePinCode;