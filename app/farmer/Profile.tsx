import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView , ActivityIndicator} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfilePicture from '../components/ProfilePicture';

import { db, my_auth } from '../../firebaseConfig';
import { useFarmer } from '../hooks/fetch_farmer';
import { use } from 'i18next';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, type Timestamp, limit } from "firebase/firestore"
import { getAuth } from "firebase/auth"


const Profile = () => {
  const { t, i18n } = useTranslation();
  const { userName, email, city } = useUser();
  const { farmerData , loading: farmerLoading} = useFarmer();
  const [consultations, setConsultations] = useState(0);
  
  const getFarmerConsultationCount = async () => {
      const auth = getAuth()
      const user = auth.currentUser
  
      if (user) {
        const consultationsRef = collection(db, "consultations")
        const q = query(consultationsRef, where("farmerId", "==", user.uid), where("status", "==", "active"))
  
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            setConsultations(snapshot.size)
          },
          (error) => {
            console.error("Error fetching consultations:", error)
          },
        )
  
        return () => unsubscribe()
      }
    }

  useEffect(() => {
    getFarmerConsultationCount();
    console.log('Farmer Data:', farmerData);
  }, [farmerData]);


  if (farmerLoading) {
    return (
      <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  if(!farmerData) {
    return (
      <View style={styles.loaderContainer}>
        <Text>{t('No farmer data found')}</Text>
      </View>
    );
  }


  const handleImageUpdated = (url: string) => {
    setProfileData(prev => ({ ...prev, profilePicture: url }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          <ProfilePicture
            imageUrl={farmerData?.profilePicture || ''}
            userId={my_auth.currentUser?.uid || ''}
            userType="farmer"
            onImageUpdated={handleImageUpdated}
          />
          <Text style={[styles.name, i18n.language === 'ur' && styles.urduText]}>
            {farmerData?.name || ''}
          </Text>
          <Text style={[styles.role, i18n.language === 'ur' && styles.urduText]}>
            {t('Farmer')}
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{farmerData?.coins || 0}</Text>
            <Text style={styles.statLabel}>{t('Coins')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{consultations || 0}</Text>
            <Text style={styles.statLabel}>{t('Consultations')}</Text>
          </View>
          
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Phone')}</Text>
              <Text style={styles.infoValue}>{farmerData?.phoneNumber || ''}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Email')}</Text>
              <Text style={styles.infoValue}>{farmerData?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('City')}</Text>
              <Text style={styles.infoValue}>{farmerData?.city || ''}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t('Budget')}</Text>
              <Text style={styles.infoValue}>{farmerData?.budget || ''}</Text>
            </View>
          </View>


        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileSection: {
    padding: 20,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  role: {
    fontSize: 18,
    color: '#E8F5E9',
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 8,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 15,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    margin:2
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  infoSection: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginTop: 2,
  },
  urduText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

export default Profile; 