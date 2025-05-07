import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image , Text} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';

const UserSelectionScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleUserSelection = (userType: 'Farmer' | 'Expert' | 'Buyer') => {
    router.push({ pathname: '/SignIn', params: { userType } });
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <  View style={styles.container}>
      <View style={styles.languagePickerContainer}>
        <Picker
          selectedValue={i18n.language}
          onValueChange={(itemValue) => changeLanguage(itemValue)}
          style={styles.languagePicker}
          dropdownIconColor="#FFC107"
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="اردو" value="ur" />
        </Picker>
      </View>
      <Image 
        source={require('../assets/app-logo-3.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <  Text style={styles.welcomeText}>{t('welcome')}</  Text>
      <  Text style={styles.questionText}>{t('andYouAre')}</  Text>
      <View style={styles.buttonContainer}>
        {[
          { type: 'Farmer', icon: require('../assets/images/farmer.png') },
          { type: 'Expert', icon: require('../assets/images/badge.png') },
          { type: 'Buyer', icon: require('../assets/images/investor.png') },
        ].map((user) => (
          <TouchableOpacity
            key={user.type}
            style={styles.button}
            onPress={() => handleUserSelection(user.type as 'Farmer' | 'Expert' | 'Buyer')}
          >
            <Image 
              source={user.icon} 
              style={styles.icon}
              resizeMode="contain"
            />
            <  Text style={styles.buttonText}>{t(user.type.toLowerCase())}</  Text>
          </TouchableOpacity>
        ))}
      </View>
    </  View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
  },
  languagePickerContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    overflow: 'hidden',
    width: 150,
    height: 50,
  },
  languagePicker: {
    width: 150,
    height: 53,
    color: '#FFC107',
    fontSize: 14,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
    borderRadius: 15,
    marginTop: 30,
    
  },
  welcomeText: {
    
    fontSize: 33,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    paddingTop: 5,
    lineHeight: 30,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 33,
    color: '#FFEB3B',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    width: '30%',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 10,
    marginTop: 55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserSelectionScreen;
