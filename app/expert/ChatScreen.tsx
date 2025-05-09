import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ChatScreenComponent from '../components/ChatScreen'; // Adjust the import path as necessary
import { getAuth } from "firebase/auth"
const ChatScreen = () => {
    const auth = getAuth()
const currentUser = auth.currentUser
// const expertId = currentUser?.uid   
const route = useRoute();
//   const {
//     farmerId,
//   } = route.params;
//   console.log(farmerId,expertId);
const farmerId =  "60d0fe4f5311236168a109ca"
  const expertId =  "60d0fe4f5311236168a109cb"
console.log(farmerId,expertId);
  return (
    <View style={styles.container}>
      <ChatScreenComponent currentUserId={expertId} otherUserId={farmerId} userType="expert" />
    </View>
  );
  };
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default ChatScreen;