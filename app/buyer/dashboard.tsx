import React, { useState , useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { TouchableOpacity, View, StyleSheet , ActivityIndicator , Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AuctionSystemTab from './AuctionSystemTab';
import AccountTab from './AccountTab';
import CoinScreen from './CoinScreen';
import CoinDisplay from '../../components/CoinDisplay';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBuyer } from './hooks/fetch_buyer';
import { use } from 'i18next';


const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, size = 26 }: { name: string; color: string; size?: number }) => (
  <View style={styles.iconContainer}>
    <MaterialCommunityIcons name={name} size={size} color={color} />
  </View>
);

const BuyerDashboard = () => {
  const { t , i18n} = useTranslation();
  const [coins, setCoins] = useState(120);
  const navigation = useNavigation();
  const { profileData, updateProfilePicture } = useBuyer();
  
    useEffect(() => {
      const fetchCoins = async () => {
        if (profileData) {
          setCoins(profileData.coins);
        }
      };
      fetchCoins();
    }, [profileData]);
  
if (profileData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('Loading profile...')}</Text>
      </View>
    );
  }

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  


  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName = '';

          if (route.name === t('auctionSystem')) {
            iconName = focused ? 'gavel' : 'gavel';
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
          paddingBottom: 8,
          marginHorizontal: 20,

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
        headerStyle: {
          backgroundColor: '#61B15A',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
        },
        headerRight: () => (
          <View>
          <TouchableOpacity
            style={styles.coinButton}
            onPress={() => navigation.navigate('buyer/CoinScreen' as never)}
          >
            <CoinDisplay coins={coins} />
          </TouchableOpacity>

            <TouchableOpacity 
                        style={[
                          styles.languageToggle, 
                          { width: i18n.language === 'en' ? 55 : 70 } // Adjust width based on language
                        ]} 
                        onPress={toggleLanguage}>
                        <Text style={styles.languageToggleText}>
                          {i18n.language === 'en' ? 'اردو' : 'English'}
                        </Text>
           </TouchableOpacity>
            </View>
          
          
        ),
      })}
    >
      <Tab.Screen
        name={t('auctionSystem')}
        component={AuctionSystemTab}
        options={{
          tabBarLabel: t('Auction'),
        }}
      />
      <Tab.Screen
        name={t('account')}
        component={AccountTab}
        options={{
          tabBarLabel: t('Account'),
        }}
      />
      
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  coinButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,

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
  languageToggle: {
    position: 'absolute',
    top: 3,
    right: 85,
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 10,
    width:70,
    textAlign: 'center',

  },
  languageToggleText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default BuyerDashboard;