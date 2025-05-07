import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export function useInitialNavigation() {
  const router = useRouter();

  useEffect(() => {
    async function handleInitialNavigation() {
      try {
        const userAuthenticated = await SecureStore.getItemAsync('userAuthenticated');
        const userType = await SecureStore.getItemAsync('userType');

        // Use requestAnimationFrame to ensure the layout is mounted
        requestAnimationFrame(() => {
          if (userAuthenticated === 'true' && userType) {
            router.replace(`/${userType.toLowerCase()}/dashboard`);
          } else {
            // If not authenticated, navigate to language selection
            router.replace('/LanguageSelection');
          }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        // On error, navigate to language selection as fallback
        requestAnimationFrame(() => {
          router.replace('/LanguageSelection');
        });
      }
    }

    handleInitialNavigation();
  }, []);
} 