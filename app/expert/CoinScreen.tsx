import React from 'react';
import { ScrollView, StyleSheet, View , Text} from 'react-native';
import { Button, ListItem, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useExpert } from './hooks/fetch_expert';
import { useState, useEffect } from 'react';


const CoinScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [coins, setCoins] = useState(200);
  const { profileData, updateProfilePicture } = useExpert();
  
  
  const [consultations, setConsultations] = React.useState([
    { id: 1, farmer: 'John Doe', duration: '30 min', coins: 50, date: '2023-05-01' },
    { id: 2, farmer: 'Jane Smith', duration: '45 min', coins: 75, date: '2023-04-28' },
  ]);

  useEffect(() => { 
      const fetchCoins = async () => {
        if (profileData) {
          setCoins(profileData.coins);
        }
      };
      fetchCoins();
    }
    , [profileData]);



  return (
    < View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.balanceCard}>
          < Text style={styles.balanceTitle}>
            {i18n.language === 'ur' ? 'کمائے گئے کوائنز کا بیلنس' : t('Earned Coins Balance')}
          </ Text>
          < Text style={styles.balance}>
            {coins} {i18n.language === 'ur' ? 'ایگرو کوائنز' : t('agroCoins')}
          </ Text>
        </View>
        
        <View style={styles.card}>
          < Text style={styles.sectionTitle}>
            {i18n.language === 'ur' ? 'مشاورت کی تاریخ' : t('Consultation History')}
          </ Text>
          {consultations.map((item, i) => (
            <ListItem key={i} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{item.farmer}</ListItem.Title>
                <ListItem.Subtitle>{item.date} - {item.duration}</ListItem.Subtitle>
              </ListItem.Content>
              < Text style={styles.earned}>+{item.coins}</ Text>
            </ListItem>
          ))}
        </View>
      </ScrollView>
    </ View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    padding: 20,
  },
  balanceCard: {
    borderRadius: 10,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#61B15A',
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    paddingBottom: 10,
    paddingTop: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 20,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  earned: {
    color: 'green',
  },
  button: {
    backgroundColor: '#FFC107',
    borderRadius: 25,
  },
  buttonTitle: {
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
});

export default CoinScreen;
