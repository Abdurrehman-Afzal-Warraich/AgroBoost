import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COIN_PRICE = 10; // Price in Rs per coin

const BuyCoins = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [coinAmount, setCoinAmount] = useState('');

  const totalPrice = Number(coinAmount) * COIN_PRICE;

  const handlePress = () => {
    if (!coinAmount || Number(coinAmount) <= 0) {
      alert(t('Please enter a valid number of coins'));
      return;
    }
    router.push({
      pathname: '/buyer/PaymentSystem',
      params: {
        amount: totalPrice,
        coins: coinAmount
      }
    });
  };

  const handleCoinAmountChange = useCallback((text: string) => {
    // Only allow positive numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setCoinAmount(numericValue);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <MaterialCommunityIcons name="cash" size={60} color="#4CAF50" style={styles.icon} />
        <Text style={styles.title}>{t('buyCoins')}</Text>
        <Text style={styles.content}>{t('buyCoinsContent')}</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="currency-usd" size={24} color="#666" />
            <TextInput
              style={styles.input}
              placeholder={t('Enter number of coins')}
              keyboardType="numeric"
              value={coinAmount}
              onChangeText={handleCoinAmountChange}
            />
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('Total Price')}:</Text>
            <Text style={styles.priceValue}>Rs. {totalPrice}</Text>
          </View>

          <Text style={styles.rateInfo}>
            {t('Rate')}: Rs. {COIN_PRICE} {t('per coin')}
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.button,
            (!coinAmount || Number(coinAmount) <= 0) && styles.buttonDisabled
          ]} 
          onPress={handlePress}
          disabled={!coinAmount || Number(coinAmount) <= 0}
        >
          <Text style={styles.buttonText}>{t('Proceed to Payment')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rateInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BuyCoins;
