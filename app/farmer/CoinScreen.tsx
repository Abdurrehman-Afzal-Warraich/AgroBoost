import React  from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Button, ListItem, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useFarmer } from '../hooks/fetch_farmer';


const CoinScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [balance, setBalance] = React.useState(100); // Example balance
  const { farmerData , loading: farmerLoading} = useFarmer();
    farmerData?.coins && setBalance(farmerData.coins);
    console.log('Farmer Data:', farmerData?.coins);
  
    useEffect(() => { 
      const fetchCoins = async () => {
        if (farmerData) {
          setBalance(farmerData.coins);
        }
      };
      fetchCoins();
    }
    , [farmerData]);


  const [transactions, setTransactions] = React.useState([
    { id: 1, type: 'Spent', amount: 10, service: 'Yield Prediction', date: '2023-05-01' },
    { id: 2, type: 'Spent', amount: 20, service: 'Expert Consultation', date: '2023-04-29' },
    { id: 3, type: 'Earned', amount: 50, service: 'Crop Sale (Auction)', date: '2023-04-28' },
  ]);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
    
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>
            {i18n.language === 'ur' ? 'موجودہ بیلنس' : t('Current Balance')}
          </Text>
          <Text style={styles.balance}>
            {balance} {i18n.language === 'ur' ? 'ایگرو کوائنز' : t('agroCoins')}
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {i18n.language === 'ur' ? 'لین دین کی تاریخ' : t('Transaction History')}
          </Text>
          {transactions.map((item, i) => (
            <ListItem key={i} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>
                  {i18n.language === 'ur' ? 
                    (item.service === 'Yield Prediction' ? 'پیداوار کی پیش گوئی' :
                     item.service === 'Expert Consultation' ? 'ماہر مشاورت' :
                     'فصل کی فروخت (نیلامی)') : 
                    item.service}
                </ListItem.Title>
                <ListItem.Subtitle>{item.date}</ListItem.Subtitle>
              </ListItem.Content>
              <Text style={item.type === 'Spent' ? styles.spent : styles.earned}>
                {item.type === 'Spent' ? '-' : '+'}{item.amount}
              </Text>
            </ListItem>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 60, // Add padding to account for back button
  },
  balanceCard: {
    borderRadius: 10,
    marginTop: 20,
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
    padding: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
