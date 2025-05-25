import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, my_auth } from '../../../firebaseConfig';

interface UpdateBuyerDetailsParams {
  name?: string;
  phoneNumber?: string;
  city?: string;
}

export const useUpdateBuyerDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBuyerDetails = useCallback(async (details: UpdateBuyerDetailsParams) => {
    try {
      setLoading(true);
      setError(null);
      const user = my_auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const buyerDocRef = doc(db, 'buyer', user.uid);
      await updateDoc(buyerDocRef, details);
      Alert.alert('Success', 'Buyer details updated successfully');
    } catch (err: any) {
      console.error('Error updating buyer details:', err);
      setError(err.message || 'An error occurred');
      Alert.alert('Error', err.message || 'Failed to update buyer details');
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateBuyerDetails, loading, error };
};
