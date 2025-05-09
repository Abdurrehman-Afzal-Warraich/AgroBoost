import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ChatScreenComponent from '../components/ChatScreen';

const ChatScreen = () => {
  const route = useRoute();
//   const { expertId, farmerId } = route.params;
const farmerId =  "60d0fe4f5311236168a109ca"
  const expertId =  "60d0fe4f5311236168a109cb"
  console.log(expertId, farmerId);

  return (
    <View style={styles.container}>
      <ChatScreenComponent currentUserId={farmerId} otherUserId={expertId} userType="farmer" />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default ChatScreen;