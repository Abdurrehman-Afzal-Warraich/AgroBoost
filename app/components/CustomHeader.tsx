import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const CustomHeader = () => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          console.log('No back history');
        }
      }}
    >
      <Icon name="arrow-back" type="material" color="white" size={30} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 5,
    marginRight: 10,
    
  },
});

export default CustomHeader; 