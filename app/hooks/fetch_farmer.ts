// hooks/fetch_farmer.ts
import { useState, useEffect, useCallback } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db, my_auth } from '../../firebaseConfig';

interface FarmerData {
  name: string;
  email: string;
  city: string;
  address: string;
  coins: number;
  phoneNumber: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export const useFarmer = () => {
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmerData = useCallback(async () => {
    const currentUser = my_auth.currentUser;
    if (!currentUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const farmerRef = doc(db, 'farmer', currentUser.uid);
      const farmerSnap = await getDoc(farmerRef);

      if (farmerSnap.exists()) {
        const data = farmerSnap.data() as FarmerData;
        // Only update state if data has actually changed
        if (JSON.stringify(data) !== JSON.stringify(farmerData)) {
          setFarmerData(data);
        }
      } else {
        setFarmerData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch farmer data');
    } finally {
      setLoading(false);
    }
  }, [farmerData]); // Add farmerData as dependency to prevent unnecessary state updates

  const reloadFarmerData = useCallback(() => {
    setLoading(true);
    fetchFarmerData();
  }, [fetchFarmerData]);

  useEffect(() => {
    if (!farmerData) {
      fetchFarmerData();
    }
  }, [fetchFarmerData]);

  return { farmerData, loading, error, reloadFarmerData };
};