import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, my_auth } from '../../../firebaseConfig';

/**
 * Custom hook to fetch and subscribe to expert data from Firestore
 * @returns {Object} Expert profile data and loading state
 */
export const useExpert = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    city: '',
    address: '',
    numberOfRatings: 0,
    pendingConsultations: 0,
    totalConsultations: 0,
    completedConsultations: 0,
    specialization: '',
    experience: '',
    consultationHours: {} as { start?: string; end?: string } | string,
    consultations: 0,
    coins: 0,
    profilePicture: '',
    preferredLanguage: 'en',
    phoneNumber: '',
    rating: 0,
    totalRatings: 0,
    loading: true
  });

  const updateProfilePicture = (url) => {
    setProfileData(prev => ({ ...prev, profilePicture: url }));
  };

  useEffect(() => {
    const user = my_auth.currentUser;
    if (!user) {
      setProfileData(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'expert', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          city: data.city || '',
          address: data.address || '',
          numberOfRatings: data.numberOfRatings || 0,
          pendingConsultations: data.pendingConsultations || 0,
          totalConsultations: data.totalConsultations || 0,
          completedConsultations: data.completedConsultations || 0,
          specialization: data.specialization || '',
          experience: data.experience || '',
          consultationHours: data.consultationHours || '',
          consultations: data.consultations || 0,
          coins: data.coins || 0,
          profilePicture: data.profilePicture || '',
          preferredLanguage: data.preferredLanguage || 'en',
          phoneNumber: data.phoneNumber || '',
          rating: data.rating || 0,
          totalRatings: data.totalRatings || 0,
          loading: false
        });
      } else {
        // Document doesn't exist
        setProfileData(prev => ({ ...prev, loading: false }));
      }
    }, (error) => {
      console.error("Error fetching expert data:", error);
      setProfileData(prev => ({ ...prev, loading: false }));
    });

    return () => unsubscribe();
  }, []);

  return {
    profileData,
    updateProfilePicture
  };
};