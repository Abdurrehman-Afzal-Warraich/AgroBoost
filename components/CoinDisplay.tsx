import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Icon } from 'react-native-elements';

interface CoinDisplayProps {
  coins: number;
  rs: number;
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({ coins , rs} ) => {
  return (
    <View style={styles.container}>
      <Icon name="coins" type="font-awesome-5" color="#FFC107" size={20} />
      <  Text style={styles.coinText}>{coins} ({rs} Rs)</  Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    
  },
  coinText: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
});

export default CoinDisplay;
