import React from 'react';
import { StyleSheet, View, TouchableOpacity , Text} from 'react-native';
import { Icon } from 'react-native-elements';
import { useRouter } from 'expo-router';

const Settings = () => {
  const router = useRouter();
  
  const settingsItems = [
    {
      title: 'Profile Settings',
      icon: 'person-outline',
      route: 'expert/ProfileSettings',
      description: 'Update your professional details'
    },
    {
      title: 'Check Transaction History',
      icon: 'schedule',
      route: 'buyer/ConsultationHours',
      description: 'See your transaction history'
    },
    {
      title: 'Change PIN Code',
      icon: 'lock-outline',
      route: 'expert/ChangePinCode',
      description: 'Change your security PIN'
    }
  ];

  const handleSettingPress = (route: string) => {
    router.push(route as never);
  };

  return (
    <  View style={styles.container}>
      <View style={styles.settingsCard}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.settingItem,
              index === settingsItems.length - 1 && styles.lastItem
            ]}
            onPress={() => handleSettingPress(item.route)}
          >
            <View style={styles.settingContent}>
              <View style={styles.iconContainer}>
                <Icon
                  name={item.icon}
                  type="material"
                  color="#61B15A"
                  size={24}
                />
              </View>
              <View style={styles.textContainer}>
                <  Text style={styles.settingTitle}>
                  {item.title}
                </  Text>
                <  Text style={styles.settingDescription}>
                  {item.description}
                </  Text>
              </View>
            </View>
            <Icon
              name="chevron-right"
              type="material"
              color="#61B15A"
              size={24}
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
    padding: 15,
    justifyContent: 'center',
   
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default Settings; 