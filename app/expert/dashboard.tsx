import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { TouchableOpacity, View, StyleSheet, Platform , Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MessagesTab from './MessagesTab';
import AccountTab from './AccountTab';
import MenuTab from './MenuTab';
import CoinDisplay from '../../components/CoinDisplay';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useExpert } from './hooks/fetch_expert';


const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, size = 26 }: { name: string; color: string; size?: number }) => (
  <View style={styles.iconContainer}>
    <MaterialCommunityIcons name={name as any} size={size} color={color} />
  </View>
);

const ExpertDashboard = () => {
  const { t, i18n } = useTranslation();
  const [coins, setCoins] = useState(200);
  const navigation = useNavigation();
  const { profileData, updateProfilePicture } = useExpert();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  useEffect(() => { 
    const fetchCoins = async () => {
      if (profileData) {
        setCoins(profileData.coins);
      }
    };
    fetchCoins();
  }
  , [profileData]);
  

  const screenOptions: BottomTabNavigationOptions = {
    tabBarActiveTintColor: '#FFC107',
    tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
    tabBarStyle: {
      backgroundColor: '#4CAF50',
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
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    headerStyle: {
      backgroundColor: '#4CAF50',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 20,
      textAlign: i18n.language === 'ur' ? 'right' : 'left',
    },
    headerTitleAlign: i18n.language === 'ur' ? 'left' : 'left',
    headerRight: () => (

      <View>
        <TouchableOpacity
        style={styles.coinButton}
        onPress={() => navigation.navigate('expert/CoinScreen' as never)}
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
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarIcon: ({ focused, color }) => {
          let iconName = '';

          if (route.name === t('messages')) {
            iconName = focused ? 'message-text' : 'message-text-outline';
          } else if (route.name === t('account')) {
            iconName = focused ? 'account' : 'account-outline';
          }
          else if (route.name === t('menu')) {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          }

          return <TabIcon name={iconName} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name={t('menu')} 
        component={MenuTab}
        options={{
          title: t('menu'),
        }}
      />

    <Tab.Screen 
        name={t('messages')} 
        component={MessagesTab}
        options={{
          title: t('messages'),
        }}
      />
      <Tab.Screen 
        name={t('account')} 
        component={AccountTab}
        options={{
          title: t('account'),
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
    marginRight: 10,
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

export default ExpertDashboard;