// hooks/fetch_farmer.ts
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

interface FarmerData {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  budget?: number;
  // Add other fields as needed
}

export const useFarmer = () => {
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFarmerData = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const farmerDoc = await getDoc(doc(db, "farmer", user.uid));
      if (farmerDoc.exists()) {
        const data = farmerDoc.data() as FarmerData;
        setFarmerData(data);
      }
    } catch (error) {
      console.error("Error fetching farmer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  const reloadFarmerData = useCallback(async () => {
    setLoading(true);
    await fetchFarmerData();
  }, [fetchFarmerData]);

  return { farmerData, loading, reloadFarmerData };
};