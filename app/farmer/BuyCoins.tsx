import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const BuyCoins = () => {
  const { t } = useTranslation();
  const navigation = useNavigation(); // 👈 get the navigation object

  const handlePress = () => {
    router.push('/buyer/PaymentSystem'); // 👈 navigate to PaymentSystem screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('buyCoins')}</Text>
      <Text style={styles.content}>{t('buyCoinsContent')}</Text>

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>{t('goToPayment')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  content: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BuyCoins;
