import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, my_auth } from '../../../firebaseConfig';

interface UpdateExpertDetailsParams {
  name?: string;
  city?: string;
  experience?: string;
  phoneNumber?: string;
  consultationHours?: {
    start: string;
    end: string;
  };
}

export const useUpdateExpertDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExpertDetails = useCallback(async (details: UpdateExpertDetailsParams) => {
    try {
      setLoading(true);
      setError(null);

      const user = my_auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const expertDocRef = doc(db, 'expert', user.uid);

      const updateData: { [key: string]: any } = {
        ...details,
        'consultationHours.start': details.consultationHours?.start,
        'consultationHours.end': details.consultationHours?.end,
      };
      delete updateData.consultationHours;
      // Ensure experience and experienceYears are both updated for consistency
      if (details.experience) {
        updateData.experience = details.experience;
        updateData.experienceYears = String(details.experience);
      }
      if (details.city) {
        updateData.city = details.city;
      }
      await updateDoc(expertDocRef, updateData);

      Alert.alert('Success', 'Expert details updated successfully');
    } catch (err: any) {
      console.error('Error updating expert details:', err);
      setError(err.message || 'An error occurred');
      Alert.alert('Error', err.message || 'Failed to update expert details');
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateExpertDetails, loading, error };
};
