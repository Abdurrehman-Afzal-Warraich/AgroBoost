import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rtdb } from '@/firebaseConfig';
import { ref, onValue, remove } from 'firebase/database';
import AuctionBids from './AuctionBids';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';


interface Auction {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhoto: string;
  cropName: string;
  location: string;
  totalPrice: string;
  startingPrice: string;
  totalQuantity: string;
  sellingQuantity: string;
  createdAt: Timestamp;
}

const FarmerAuctionDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAuctionId, setExpandedAuctionId] = useState<string | null>(null);
  const router = useRouter();
  const toggleBids = (auctionId: string) => {
    // If the clicked auction is already expanded, close it
    if (expandedAuctionId === auctionId) {
      setExpandedAuctionId(null);
    } else {
      // Otherwise, open the clicked auction and close the previous one
      setExpandedAuctionId(auctionId);
    }
  };

  const fetchAuctions = () => {
    if (!user?.uid) return;

    const auctionsRef = ref(rtdb, 'auctions');

    onValue(auctionsRef, snapshot => {
      console.log('Firebase auctions snapshot:', snapshot.val());

      const data = snapshot.val();
      if (!data) {
        setAuctions([]);
        return;
      }

      const fetchedAuctions: Auction[] = Object.entries(data)
        .map(([id, value]: [string, any]) => ({
          id,
          farmerId: value.createdBy?.farmerId || '',
          farmerName: value.createdBy?.name || 'Unknown',
          farmerPhoto: '', // placeholder
          cropName: value.cropName,
          location: value.location,
          totalPrice: value.totalPrice || (value.sellableQuantity * value.startingPrice).toString(),
          startingPrice: value.startingPrice,
          totalQuantity: value.quantity?.toString() || '0',
          sellingQuantity: value.sellableQuantity?.toString() || '0',
          createdAt: new Timestamp(Math.floor(value.createdAt / 1000), 0),
        }))
        .filter(auction => auction.farmerId === user.uid)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

      setAuctions(fetchedAuctions);
    });
  };

  useEffect(() => {
    fetchAuctions(); // Initial fetch
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuctions(); // Fetch auctions again
    setRefreshing(false);
  };

  const formatDate = (timestamp: Timestamp): string => {
    return timestamp ? format(timestamp.toDate(), 'PPP') : '';
  };

  const deleteAuction = async (auctionId: string) => {
    try {
      const auctionRef = ref(rtdb, `auctions/${auctionId}`);
      await remove(auctionRef);
      // The UI will automatically update due to the onValue listener
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  <Stack.Screen options={{ title: 'Auction Dashboard' }} />

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
    <View style={styles.header}>
  <MaterialCommunityIcons name="store" size={24} color="#3A8A41" />
  <Text style={styles.headerTitle}>{t('My Auctions')}</Text>
  <Pressable style={styles.homeButton} onPress={() => router.replace('/farmer/dashboard')}>
    <MaterialCommunityIcons name="home" size={24} color="white" />
  </Pressable>
</View>


      {auctions.map((auction) => (
        <Pressable key={auction.id} onPress={() => toggleBids(auction.id)}>
          <View style={styles.auctionCard}>
            <View style={styles.profileSection}>
              <Image
                source={{
                  uri: auction.farmerPhoto || 'https://via.placeholder.com/100',
                }}
                style={styles.profilePhoto}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.farmerName}>{auction.farmerName}</Text>
                <Text style={styles.date}>{formatDate(auction.createdAt)}</Text>
              </View>
              <Pressable 
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent Pressable
                  deleteAuction(auction.id);
                }}
              >
                <MaterialCommunityIcons name="delete" size={24} color="#FF5252" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Crop')}</Text>
                <Text style={styles.value}>{auction.cropName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Location')}</Text>
                <Text style={styles.value}>{auction.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Total Quantity')}</Text>
                <Text style={styles.value}>
                  {auction.totalQuantity} {t('maunds')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Price per Maund')}</Text>
                <Text style={styles.value}>Rs. {auction.startingPrice}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Starting Price')}</Text>
                <Text style={styles.value}>Rs. {auction.totalPrice}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>{t('Selling Quantity')}</Text>
                <Text style={styles.value}>
                  {auction.sellingQuantity} {t('maunds')}
                </Text>
              </View>
            </View>

            <View style={styles.notificationSection}>
              <Text style={styles.notificationTitle}>{t('Bids Notifications')}</Text>
              {/* Add dynamic notifications if needed */}
            </View>

            {expandedAuctionId === auction.id && (
              <AuctionBids auctionId={auction.id} />
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50', // Updated to green
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: 'white', // White text on green background
  },
  homeButton: {
    marginLeft: 'auto',
    padding: 8,
    backgroundColor: '#388E3C',
    borderRadius: 6,
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Green accent border
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between', // Add this to properly space the delete button
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFC107', // Yellow border for profile photos
  },
  profileInfo: {
    flex: 1, // Add this to allow proper spacing
    marginLeft: 12,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50', // Green text for farmer name
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107', // Yellow divider
    marginVertical: 12,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50', // Green for values
  },
 notificationSection: {
    backgroundColor: '#FFC10720', // Semi-transparent yellow background
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFC107', // Yellow border
    alignItems: 'center', // Center content horizontally
    justifyContent: 'center', // Center content vertically
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50', // Green text
    textAlign: 'center', // Center the text
  },
});

export default FarmerAuctionDashboard;
