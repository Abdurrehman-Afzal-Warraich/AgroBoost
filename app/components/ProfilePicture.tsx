import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTranslation } from 'react-i18next';

interface ProfilePictureProps {
  imageUrl?: string;
  size?: number;
  userId: string;
  userType: 'farmer' | 'expert' | 'buyer';
  onImageUpdated?: (url: string) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  imageUrl,
  size = 120,
  userId,
  userType,
  onImageUpdated
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Required'), t('Please allow access to your photo library'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('Error'), t('Failed to pick image'));
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${userType}/${userId}`);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore document with new image URL
      const userRef = doc(db, userType, userId);
      await updateDoc(userRef, {
        profilePicture: downloadUrl
      });

      if (onImageUpdated) {
        onImageUpdated(downloadUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(t('Error'), t('Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <MaterialCommunityIcons name="account" size={size * 0.6} color="#FFFFFF" />
        </View>
      )}
      <TouchableOpacity
        style={[styles.uploadButton, { right: 0, bottom: 0 }]}
        onPress={pickImage}
        disabled={uploading}
      >
        <MaterialCommunityIcons name="plus-circle" size={32} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholder: {
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  uploadButton: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 2,
    margin:8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ProfilePicture; 