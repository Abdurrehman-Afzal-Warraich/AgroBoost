import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, my_auth } from '../../../firebaseConfig';

/**
 * Custom hook to fetch and subscribe to buyer data from Firestore
 * @returns {Object} Buyer profile data and loading state
 */
export const useBuyer = () => {
  const [profileData, setProfileData] = useState({
    businessName: '',
    businessType: '',
    transactions: 0,
    coins: 0,
    profilePicture: '',
    preferredLanguage: 'en',
    phoneNumber: '',
    address: '',
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

    const unsubscribe = onSnapshot(doc(db, 'buyer', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfileData({
          businessName: data.businessName || '',
          businessType: data.businessType || '',
          transactions: data.transactions || 0,
          coins: data.coins || 0,
          profilePicture: data.profilePicture || '',
          preferredLanguage: data.preferredLanguage || 'en',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          loading: false
        });
      } else {
        // Document doesn't exist
        setProfileData(prev => ({ ...prev, loading: false }));
      }
    }, (error) => {
      console.error("Error fetching buyer data:", error);
      setProfileData(prev => ({ ...prev, loading: false }));
    });

    return () => unsubscribe();
  }, []);

  return {
    profileData,
    updateProfilePicture
  };
};