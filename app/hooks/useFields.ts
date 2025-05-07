import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

export interface FieldData {
  id: string;
  cropType: string;
  soilType: string;
  sowingDate: Date;
  areaInAcres: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  userId: string;
}

export const useFields = () => {
  const [fields, setFields] = useState<FieldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view your fields');
        return;
      }

      // Query the root "fields" collection for fields with matching userId
      const fieldsRef = collection(db, 'fields');
      const fieldsQuery = query(fieldsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(fieldsQuery);
      
      const fieldsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sowingDate: doc.data().sowingDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as FieldData[];

      setFields(fieldsList);
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError('Failed to load field data');
    } finally {
      setLoading(false);
    }
  };

  const addField = async (fieldData: Omit<FieldData, 'id' | 'createdAt' | 'userId'>) => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to save field data');
        return false;
      }

      // Add to the root "fields" collection instead of a nested collection
      const fieldsRef = collection(db, 'fields');
      await addDoc(fieldsRef, {
        ...fieldData,
        createdAt: Timestamp.now(),
        sowingDate: Timestamp.fromDate(fieldData.sowingDate),
        userId: user.uid,
      });

      // Refresh fields after adding
      await fetchFields();
      return true;
    } catch (err) {
      console.error('Error saving field data:', err);
      setError('Failed to save field data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  return {
    fields,
    loading,
    error,
    fetchFields,
    addField,
  };
};