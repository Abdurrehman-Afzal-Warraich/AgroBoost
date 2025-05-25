import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface UpdateFarmerData {
  name: string;
  phoneNumber: string;
  city: string;
  budget: string;
}

interface UseUpdateFarmerReturn {
  updateFarmer: (userId: string, data: UpdateFarmerData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useUpdateFarmer = (): UseUpdateFarmerReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFarmer = async (userId: string, data: UpdateFarmerData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Name is required');
      }

      // Validate phone number format if provided
      if (data.phoneNumber && !data.phoneNumber.startsWith('+92')) {
        throw new Error('Phone number must include +92 prefix');
      }

      // Reference to the farmer document
      const farmerRef = doc(db, 'farmer', userId);

      // Prepare update data
      const updateData = {
        name: data.name.trim(),
        phoneNumber: data.phoneNumber.trim(),
        city: data.city.trim(),
        budget: data.budget.trim(),
        updatedAt: serverTimestamp(),
      };

      // Remove empty fields except for name and updatedAt
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'updatedAt') return true; // Always include timestamp
          if (key === 'name') return value; // Name is required
          return value !== ''; // Include non-empty values
        })
      );

      // Update the document
      await updateDoc(farmerRef, filteredUpdateData);

      console.log('Farmer profile updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update farmer profile';
      setError(errorMessage);
      console.error('Error updating farmer profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateFarmer,
    loading,
    error,
  };
};