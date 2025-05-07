import { View } from 'react-native';
import { useInitialNavigation } from './hooks/useInitialNavigation';

export default function Index() {
  useInitialNavigation();
  
  return <View />;
}
