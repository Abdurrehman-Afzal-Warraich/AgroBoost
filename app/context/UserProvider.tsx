import React, { createContext, useContext, useState, useEffect , useCallback, ReactNode} from 'react';
import { getAuth , onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import { ActivityIndicator , View, StyleSheet} from 'react-native';

interface UserContextProps {
  userName: string;
  userType: string;
  email: string;
  city: string;
  address: string;
  experienceYears: number;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  isLoading: boolean;
  reloadUser: () => void;
}


const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  

  const fetchUser = async () => {
    setIsLoading(true); 
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
  
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userTypeFromDoc = userData.userType;
  
          setUserName(userData.name);
          setUserType(userTypeFromDoc);
  
          const userTypeRef = doc(db, userTypeFromDoc.toLowerCase(), user.uid);
          const userTypeDoc = await getDoc(userTypeRef);
  
          if (userTypeDoc.exists()) {
            const userTypeData = userTypeDoc.data();
            setEmail(userTypeData.email);
            setCity(userTypeData.city || '');
            setAddress(userTypeData.address || '');
            if (userTypeFromDoc === 'Expert') {
              setExperienceYears(userTypeData.experienceYears || 0);
            }
          } else {
            console.error('User type-specific data not found');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const reloadUser = useCallback(() => {
    fetchUser();
  }, []);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUser();
      } else {
        // Reset user data if not authenticated
        setUserName('');  
        setUserType('');  
        setEmail('');
        setCity('');
        setAddress('');  
        setExperienceYears(0);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  return ( 
    <UserContext.Provider value={{ 
      userName, 
      userType, 
      email, 
      city, 
      address, 
      experienceYears, 
      isNewUser, 
      setIsNewUser, 
      reloadUser,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};

const styles = StyleSheet.create({ 
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});



export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserProvider;