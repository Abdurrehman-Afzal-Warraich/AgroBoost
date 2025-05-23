import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { rtdb } from '../../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';

interface AcceptedBid {
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
  status: string;
  paymentStatus?: string;
  paymentTimestamp?: number;
}

interface Auction {
  id: string;
  cropName: string;
  location: string;
  totalQuantity: string;
  sellingQuantity: string;
  startingPrice: string;
  createdAt: number;
  status: string;
  acceptedBid: AcceptedBid | null;
}

interface WinningBid {
  bidId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  acceptedAt?: number;
}

const FarmerAfterAuction = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auctionId, bidId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [winningBid, setWinningBid] = useState<WinningBid | null>(null);
  const [auctionDetails, setAuctionDetails] = useState<any>(null);

  useEffect(() => {
    if (!auctionId || !bidId) {
      setLoading(false);
      return;
    }

    const auctionRef = ref(rtdb, `auctions/${auctionId}`);
    const unsubscribe = onValue(auctionRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setLoading(false);
        return;
      }

      // Get the specific accepted bid
      let acceptedBid = null;
      if (data.bids && data.bids[bidId]) {
        acceptedBid = { 
          ...data.bids[bidId],
          id: bidId
        };
      }

      setAuction({
        id: auctionId as string,
        cropName: data.cropName || "Unknown",
        location: data.location || "Unknown",
        totalQuantity: data.quantity?.toString() || "0",
        sellingQuantity: data.sellableQuantity?.toString() || "0",
        startingPrice: data.startingPrice?.toString() || "0",
        createdAt: data.createdAt || Date.now(),
        status: data.status || "completed",
        acceptedBid
      });

      // Check if payment has been made
      setIsPaid(data.paymentStatus === 'paid');
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auctionId, bidId]);

  useEffect(() => {
    if (typeof auctionId !== 'string') {
      Alert.alert('Error', 'Auction ID not found');
      return;
    }

    // Fetch winning bid and auction details
    const auctionRef = ref(rtdb, `auctions/${auctionId}`);
    const unsubscribe = onValue(auctionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (!data.winningBid?.bidderName) {
          console.error('Missing bidder name in winning bid:', data.winningBid);
        }
        setWinningBid(data.winningBid || null);
        setAuctionDetails({
          cropName: data.cropName,
          quantity: data.sellableQuantity,
          location: data.location,
          createdAt: data.createdAt,
        });
      }
    });

    return () => unsubscribe();
  }, [auctionId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading auction details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Auction Complete' }} />
      
      <View style={styles.header}>
        <MaterialCommunityIcons name="trophy" size={32} color="#FFC107" />
        <Text style={styles.headerTitle}>{t('Auction Completed')}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('Winning Bid Details')}</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('Crop')}</Text>
          <Text style={styles.value}>{auctionDetails.cropName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('Quantity')}</Text>
          <Text style={styles.value}>{auctionDetails.quantity} maunds</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>{t('Location')}</Text>
          <Text style={styles.value}>{auctionDetails.location}</Text>
        </View>

        <View style={styles.winningBidSection}>
          {winningBid ? (
            <>
              <Text style={styles.bidderName}>
                {t('Winner')}: {winningBid.bidderName || t('Unknown Buyer')}
              </Text>
              <Text style={styles.bidAmount}>
                {t('Winning Amount')}: Rs. {winningBid.amount.toLocaleString()}
              </Text>
              {winningBid.acceptedAt && (
                <Text style={styles.bidTime}>
                  {t('Accepted at')}: {format(new Date(winningBid.acceptedAt), 'PPpp')}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>{t('Winning bid information not available')}</Text>
          )}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>{t('Next Steps')}</Text>
          <Text style={styles.instructionText}>
            1. {t('Contact the winning buyer to arrange delivery')}
          </Text>
          <Text style={styles.instructionText}>
            2. {t('Confirm the payment method and details')}
          </Text>
          <Text style={styles.instructionText}>
            3. {t('Prepare the crop for delivery')}
          </Text>
        </View>
      </View>
      
      <Pressable
        style={styles.backButton}
        onPress={() => router.replace('/farmer/dashboard')}
      >
        <MaterialCommunityIcons name="home" size={20} color="white" />
        <Text style={styles.backButtonText}>{t('Return to Dashboard')}</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  winningBidSection: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  bidderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  instructionsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bidTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
});

export default FarmerAfterAuction;