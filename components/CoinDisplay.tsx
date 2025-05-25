import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

interface CoinDisplayProps {
  coins: number;
  rs: number;
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({ coins , rs} ) => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/coins_1027961.png')} style={styles.icon} />
      <Text style={styles.coinText}>{coins}</Text>
      <Image source={require('../assets/rupee_10536109.png')} style={[styles.icon, { marginLeft: 12 }]} />
      <Text style={styles.coinText}>{rs} Rs</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  coinText: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
});

export default CoinDisplay;
