import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

interface FarmerData {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  budget: string;
  coins: number;
  profilePicture?: string;
}

interface UseFarmerReturn {
  farmerData: FarmerData | null;
  loading: boolean;
  error: string | null;
  refetchFarmer: () => Promise<void>;
  refreshFarmer: () => void;
}

export const useFarmer = (): UseFarmerReturn => {
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Function to fetch farmer data once
  const fetchFarmerData = useCallback(async () => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const farmerRef = doc(db, 'farmer', userId);
      const farmerSnap = await getDoc(farmerRef);

      if (farmerSnap.exists()) {
        const data = farmerSnap.data() as FarmerData;
        setFarmerData(data);
        console.log('Farmer data fetched:', data);
      } else {
        setError('Farmer data not found');
        setFarmerData(null);
      }
    } catch (err) {
      console.error('Error fetching farmer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch farmer data');
      setFarmerData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Function to refetch data (for pull-to-refresh)
  const refetchFarmer = useCallback(async () => {
    await fetchFarmerData();
  }, [fetchFarmerData]);

  // Function to trigger refresh (alternative method)
  const refreshFarmer = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Set up real-time listener
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const farmerRef = doc(db, 'farmer', userId);
    
    const unsubscribe = onSnapshot(
      farmerRef,
      (doc) => {
        setLoading(false);
        if (doc.exists()) {
          const data = doc.data() as FarmerData;
          setFarmerData(data);
          setError(null);
          console.log('Farmer data updated via listener:', data);
        } else {
          setError('Farmer data not found');
          setFarmerData(null);
        }
      },
      (err) => {
        console.error('Error in farmer data listener:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, refreshTrigger]);

  // Initial fetch on mount or when refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchFarmerData();
    }
  }, [refreshTrigger, fetchFarmerData]);

  return {
    farmerData,
    loading,
    error,
    refetchFarmer,
    refreshFarmer,
  };
};