import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MenuTab from './MenuTab';
import AccountTab from './AccountTab';
import CoinScreen from './CoinScreen';
import CoinDisplay from '../../components/CoinDisplay';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProvider, useUser } from '../context/UserProvider';
import { useFarmer } from '../hooks/fetch_farmer';
import { use } from 'i18next';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, size = 26 }: { name: string; color: string; size?: number }) => (
  <View style={styles.iconContainer}>
    <MaterialCommunityIcons name={name} size={size} color={color} />
  </View>
);

const FarmerDashboard = () => {
  const { t, i18n } = useTranslation();
  const [coins, setCoins] = useState(0);
  const navigation = useNavigation();
  const { farmerData, loading: farmerLoading } = useFarmer();

  useEffect(() => {
    if (farmerData?.coins !== undefined) {
      setCoins(farmerData.coins);
    }
  }, [farmerData?.coins]);

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName = '';

          if (route.name === t('menu')) {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === t('account')) {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <TabIcon name={iconName} color={color} />;
        },
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarStyle: {
          backgroundColor: '#61B15A',
          height: 70,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 15,
          marginHorizontal: 20,
          marginVertical: 10,
          paddingHorizontal: 10,
        },
        tabBarItemStyle: {
          marginTop: 10,
          height: 50,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 5,
          marginBottom: 8,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#61B15A',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => {
          return (
            <View>
              <TouchableOpacity 
              style={styles.coinButton}
              onPress={() => navigation.navigate('farmer/CoinScreen')}>
                <CoinDisplay coins={coins} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageToggle,
                  { width: i18n.language === 'en' ? 55 : 70 }, // Adjust width based on language
                ]}
                onPress={toggleLanguage}
              >
                <Text style={styles.languageToggleText}>
                  {i18n.language === 'en' ? 'اردو' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name={t('menu')} component={MenuTab} />
      <Tab.Screen name={t('account')} component={AccountTab} />
    </Tab.Navigator>
  );
};

const styles = {
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  coinButton: {
    marginRight: 10,
    
  },
  languageToggle: {
    position: 'absolute',
    top: -6,
    right: 65,
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 10,
    width: 70,
    TextAlign: 'center',
  },
  languageToggleText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 14,
  },
};

export default FarmerDashboard;
