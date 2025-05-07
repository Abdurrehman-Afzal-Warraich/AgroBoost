import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View , Text} from 'react-native';
import { Button, ListItem, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useBuyer } from './hooks/fetch_buyer';


const CoinScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [balance, setBalance] = React.useState(1000);
  const { profileData, updateProfilePicture } = useBuyer();
  
  const [transactions, setTransactions] = React.useState([
    { id: 1, type: 'Spent', amount: 200, item: 'Wheat Auction', date: '2023-05-01' },
    { id: 2, type: 'Bought', amount: 500, item: 'Coin Purchase', date: '2023-04-28' },
  ]);

  useEffect(() => {
        const fetchCoins = async () => {
          if (profileData) {
            setBalance(profileData.coins);
          }
        };
        fetchCoins();
      }, [profileData]);



  return (
    <  View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.balanceCard}>
          <  Text style={styles.balanceTitle}>
            {i18n.language === 'ur' ? 'موجودہ بیلنس' : t('Current Balance')}
          </  Text>
          <  Text style={styles.balance}>
            {balance} {i18n.language === 'ur' ? 'ایگرو کوائنز' : t('agroCoins')}
          </  Text>
        </View>
        <Button
          title={i18n.language === 'ur' ? 'کوائنز خریدیں' : t('buyCoins')}
          onPress={() => {/* Implement coin purchase */}}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          containerStyle={styles.buttonContainer}
        />
        <View style={styles.card}>
          <  Text style={styles.sectionTitle}>
            {i18n.language === 'ur' ? 'لین دین کی تاریخ' : t('TransactionHistory')}
          </  Text>
          {transactions.map((item, i) => (
            <ListItem key={i} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>
                  {i18n.language === 'ur' ? 
                    (item.item === 'Wheat Auction' ? 'گندم کی نیلامی' : 'کوائنز کی خریداری') : 
                    item.item}
                </ListItem.Title>
                <ListItem.Subtitle>{item.date}</ListItem.Subtitle>
              </ListItem.Content>
              <  Text style={item.type === 'Spent' ? styles.spent : styles.bought}>
                {item.type === 'Spent' ? '-' : '+'}{item.amount}
              </  Text>
            </ListItem>
          ))}
        </View>
      </ScrollView>
    </  View>
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
  spent: {
    color: 'red',
  },
  bought: {
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
