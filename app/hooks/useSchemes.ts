import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface TableData {
  Condition: string;
  Description: string;
}

export interface Scheme {
  id: string;
  Title: string;
  Description: string;
  TableData: TableData[];
}

export const useSchemes = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const schemesCollection = collection(db, 'schemes');
        const snapshot = await getDocs(schemesCollection);
        const schemesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Scheme[];
        setSchemes(schemesList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schemes:", error);
        setError("Failed to fetch schemes");
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  return { schemes, loading, error };
}; 