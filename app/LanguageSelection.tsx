import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Dimensions , Text} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LanguageSelection = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
    router.replace('/UserSelectionScreen');
  };

  return (
    <  View style={styles.container}>
      <View style={styles.topSection}>
        <Image 
          source={require('../assets/images/illustration-1.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.titleContainer}>
          <  Text style={styles.titleEnglish}>Select Language</  Text>
          <  Text style={styles.titleUrdu}>زبان منتخب کریں</  Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => changeLanguage('en')}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name="web" size={24} color="#1B5E20" />
              <View style={styles.buttonTextContainer}>
                <  Text style={styles.buttonTextEnglish}>English</  Text>
                
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#1B5E20" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => changeLanguage('ur')}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name="web" size={24} color="#1B5E20" />
              <View style={styles.buttonTextContainer}>
                <  Text style={styles.buttonTextUrdu}>اردو</  Text>
                
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#1B5E20" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </  View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#61B15A',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  illustration: {
    width: width * 0.8,
    height: width * 0.6,
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 30,
  },
  titleEnglish: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 40,
  },
  titleUrdu: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    lineHeight: 40,
  },
  buttonContainer: {
    gap: 15,
  },
  languageButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  buttonTextEnglish: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  buttonTextUrdu: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  buttonSubText: {
    fontSize: 14,
    color: '#666',
  },
});

export default LanguageSelection;
