import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';

const AuctionFormModal = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const cropName = String(params.cropName || '');
  const location = String(params.location || '');
  const predictedYield = parseFloat(params.quantity as string || '0');

  const [quantity, setQuantity] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('');
  
  const maxAllowedQuantity = predictedYield * 0.5;
  const totalPrice = parseFloat(quantity) * parseFloat(startingPrice) || 0;

  const handleQuantityChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      setQuantity(value);
      return;
    }

    if (numValue > maxAllowedQuantity) {
      Alert.alert(
        t('Invalid Quantity'),
        t('You cannot sell more than 50% of your predicted yield')
      );
      setQuantity(maxAllowedQuantity.toString());
    } else {
      setQuantity(value);
    }
  };

  const handleSubmit = () => {
    const numQuantity = parseFloat(quantity);
    if (!numQuantity || numQuantity <= 0) {
      Alert.alert(t('Invalid Input'), t('Please enter a valid quantity'));
      return;
    }

    if (numQuantity > maxAllowedQuantity) {
      Alert.alert(
        t('Invalid Quantity'),
        t('Quantity cannot exceed 50% of predicted yield')
      );
      return;
    }
    const trimmedDuration = duration.trim();
    const numDuration = parseFloat(trimmedDuration);
    console.log("Duration:", trimmedDuration, "Parsed:", numDuration);

    if (!numDuration || numDuration <= 0) {
      Alert.alert(t('Invalid Input'), t('Please enter a valid auction duration'));
      return;
    }

    if (numDuration > 5) {
      Alert.alert(
        t('Invalid Duration'),
        t('Auction duration cannot exceed 5 minutes')
      );
      return;
    }

    router.push({
      pathname: '/farmer/auction/AuctionPreview',
      params: {
        sellableQuantity: numQuantity.toString(),
        startingPrice,
        duration,
        cropName,
        location,
        totalQuantity: predictedYield.toString(),
        totalPrice: totalPrice.toString()
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <MaterialCommunityIcons name="store" size={24} color="#3A8A41" />
          <Text style={styles.headerTitle}>{t('Auction Form')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>{t('Crop Type')}</Text>
            <Text style={styles.value}>{cropName}</Text>

            <Text style={styles.label}>{t('Total Predicted Yield')}</Text>
            <Text style={styles.value}>
              {predictedYield} {t('maunds')}
            </Text>

            <Text style={styles.label}>{t('Location')}</Text>
            <Text style={styles.value}>{location}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('Selling Quantity')} (max: {maxAllowedQuantity.toFixed(2)}{' '}
              {t('maunds')})
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={handleQuantityChange}
              placeholder={t('Enter quantity')}
            />

            <Text style={styles.label}>{t('Starting Price (per maund)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={startingPrice}
              onChangeText={setStartingPrice}
              placeholder={t('Enter price')}
            />

            <Text style={styles.label}>{t('Total Price')}</Text>
            <View style={styles.totalPriceContainer}>
              <Text style={styles.totalPriceText}>Rs. {totalPrice.toFixed(2)}</Text>
            </View>

            <Text style={styles.label}>{t('Auction Duration (min)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
              placeholder="5"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>{t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {t('Continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50', // Updated to green
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: 'white', // White text on green background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333333',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#3A8A41',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  totalPriceContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A8A41',
  },
});

export default AuctionFormModal;
