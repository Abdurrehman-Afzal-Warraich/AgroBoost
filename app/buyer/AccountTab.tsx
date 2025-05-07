import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AccountTab = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear AsyncStorage data
      await AsyncStorage.multiRemove([
        'authToken',
        'userData',
        'userPreferences'
      ]);

      // Clear SecureStore data
      await SecureStore.deleteItemAsync('userAuthenticated');
      await SecureStore.deleteItemAsync('userType');
      await SecureStore.deleteItemAsync('userToken');
      
      // Show success message
      Alert.alert(
        t('Logout Successful'),
        t('You have been logged out successfully'),
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to language selection or initial screen
              router.replace('/LanguageSelection');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        t('Error'),
        t('Failed to logout. Please try again.'),
        [{ text: 'OK' }]
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t('Confirm Logout'),
      t('Are you sure you want to logout?'),
      [
        {
          text: t('Cancel'),
          style: 'cancel'
        },
        {
          text: t('Logout'),
          onPress: handleLogout,
          style: 'destructive'
        }
      ]
    );
  };

  const menuItems = [
    {
      title: t('Profile'),
      icon: 'person-outline',
      onPress: () => router.push('/buyer/Profile'),
      color: '#4CAF50', // Green
    },
    
    {
      title: t('Settings'),
      icon: 'settings',
      onPress: () => router.push('/buyer/Settings'),
      color: '#2196F3', // Blue
    },
    {
      title: t('Help'),
      icon: 'help-outline',
      onPress: () => router.push('/buyer/Help'),
      color: '#9C27B0', // Purple
    },
  ];

  return (
    <  View style={styles.container}>
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={confirmLogout}
      >
        <Icon name="logout" type="material" color="#FF4444" size={24} />
        <  Text style={styles.logoutText}>{t('Logout')}</  Text>
      </TouchableOpacity>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={item.onPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
              <Icon
                name={item.icon}
                type="material"
                color={item.color}
                size={28}
              />
            </View>
            <  Text style={styles.menuText}>{item.title}</  Text>
            <Icon 
              name="chevron-right" 
              type="material" 
              color={item.color} 
              size={24}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
      </View>
    </  View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  menuContainer: {
    padding: 20,
    paddingTop: 60,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  chevron: {
    opacity: 0.7,
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  logoutText: {
    color: '#FF4444',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default AccountTab;
