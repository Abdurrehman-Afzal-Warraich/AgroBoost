import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, my_auth } from '../../../firebaseConfig';

/**
 * Custom hook to fetch and subscribe to buyer data from Firestore
 * @returns {Object} Buyer profile data and loading state
 */
export const useBuyer = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    businessName: '',
    businessType: '',
    transactions: 0,
    coins: 0,
    city : '',
    profilePicture: '',
    preferredLanguage: 'en',
    phoneNumber: '',
    address: '',
    totalPayments: 0,
    loading: true
  });

  const updateProfilePicture = (url: string) => {
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
        // Ensure businessName is properly trimmed and validated
        const businessName = data.businessName ? data.businessName.trim() : '';
        
        if (!businessName) {
          console.warn('Buyer profile exists but business name is empty');
        }
        
        setProfileData({
          name: data.name || '',
          city: data.city || '',  
          businessName: businessName,
          businessType: data.businessType || '',
          transactions: data.transactions || 0,
          coins: data.coins || 0,
          profilePicture: data.profilePicture || '',
          preferredLanguage: data.preferredLanguage || 'en',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          totalPayments: data.totalPayments || 0,
          loading: false
        });
      } else {
        // Document doesn't exist
        console.warn('Buyer profile document does not exist');
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