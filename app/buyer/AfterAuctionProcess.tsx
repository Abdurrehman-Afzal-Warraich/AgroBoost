import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rtdb, my_auth, db } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface AuctionDetails {
  id: string;
  cropName: string;
  startingPrice: number;
  totalPrice: number;
  location: string;
  farmerName: string;
  farmerPhoto: string;
  farmerRating: string;
  sellingQuantity: string;
  totalQuantity: string;
  createdAt: number;
  acceptedBid: {
    bidderId: string;
    bidderName: string;
    amount: number;
    timestamp: number;
  };
  createdBy?: {
    farmerId: string;
    name: string;
    city?: string;
  };
}

const AfterAuctionProcess = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { auctionId } = params;
  
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<AuctionDetails | null>(null);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (!auctionId) {
      Alert.alert("Error", "No auction information found");
      router.back();
      return;
    }

    const auctionRef = ref(rtdb, `auctions/${auctionId}`);
    const unsubscribe = onValue(auctionRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setLoading(false);
        Alert.alert("Error", "Auction not found");
        router.back();
        return;
      }

      // Find the accepted bid
      let acceptedBid = null;
      if (data.bids) {
        const bidEntries = Object.entries(data.bids);
        for (const [bidId, bid] of bidEntries) {
          if ((bid as any).status === 'accepted') {
            acceptedBid = { ...bid as any, id: bidId };
            break;
          }
        }
      }

      if (!acceptedBid) {
        setLoading(false);
        Alert.alert("Error", "No accepted bid found for this auction");
        router.back();
        return;
      }

      // Check if current user is the winner
      const currentUserId = my_auth.currentUser?.uid;
      if (acceptedBid.bidderId !== currentUserId) {
        setLoading(false);
        Alert.alert("Information", "You didn't win this auction");
        router.replace('/buyer/AuctionSystemTab');
        return;
      }

      const createdBy = data.createdBy || {};
      setAuction({
        id: auctionId as string,
        cropName: data.cropName || "Unknown",
        startingPrice: Number(data.startingPrice) || 0,
        totalPrice: Number(data.totalPrice) || 0,
        location: data.location || createdBy.city || "Unknown",
        sellingQuantity: data.sellableQuantity?.toString() || "0",
        totalQuantity: data.quantity?.toString() || "0",
        farmerName: createdBy.name || "Unknown",
        farmerPhoto: createdBy.photo || "",
        farmerRating: "4.5",
        createdAt: data.createdAt || Date.now(),
        acceptedBid,
        createdBy
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auctionId, router]);

  const handleTransferAgroCoins = async () => {
    if (!auction) return;
    
    setTransferring(true);
    
    try {
      const buyerId = my_auth.currentUser?.uid;
      const farmerId = auction.createdBy?.farmerId;
      
      if (!buyerId || !farmerId) {
        throw new Error('Missing user information');
      }

      // Get buyer's current coins
      const buyerRef = doc(db, 'buyer', buyerId);
      const buyerDoc = await getDoc(buyerRef);
      const buyerCoins = buyerDoc.data()?.coins || 0;
      
      // Get farmer's current coins
      const farmerRef = doc(db, 'farmer', farmerId);
      const farmerDoc = await getDoc(farmerRef);
      const farmerCoins = farmerDoc.data()?.coins || 0;

      // Check if buyer has enough coins
      const bidAmount = auction.acceptedBid.amount;
      if (buyerCoins < bidAmount) {
        Alert.alert("Error", "Insufficient coins for this transaction");
        setTransferring(false);
        return;
      }

      // Perform the coin transfer using a transaction
      await runTransaction(db, async (transaction) => {
        // Deduct coins from buyer
        await transaction.update(buyerRef, {
          coins: buyerCoins - bidAmount
        });

        // Add coins to farmer
        await transaction.update(farmerRef, {
          coins: farmerCoins + bidAmount
        });
      });

      // Update the auction status in the database
      const auctionRef = ref(rtdb, `auctions/${auctionId}`);
      await update(auctionRef, {
        status: 'completed',
        paymentStatus: 'paid',
        paymentTimestamp: Date.now()
      });

      Alert.alert(
        "Success", 
        "Payment completed successfully!",
        [
          { 
            text: "OK", 
            onPress: () => router.replace('/buyer/AuctionSystemTab')
          }
        ]
      );
    } catch (error) {
      console.error("Error transferring AgroCoins:", error);
      Alert.alert("Error", "Failed to complete payment. Please try again.");
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading auction details...</Text>
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={50} color="#F44336" />
        <Text style={styles.errorText}>Auction information not available</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/buyer/AuctionSystemTab')}
        >
          <Text style={styles.backButtonText}>Return to Auctions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="trophy" size={30} color="#FFC107" />
        <Text style={styles.headerTitle}>{t('Congratulations!')}</Text>
      </View>
      
      <View style={styles.messageContainer}>
        <Text style={styles.congratsMessage}>
          Your bid has been accepted! Complete the payment to finalize the transaction.
        </Text>
      </View>
      
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
            <Text style={styles.farmerRating}>Rating: {auction.farmerRating}/5</Text>
            <Text style={styles.date}>
              {format(new Date(auction.createdAt), 'PPP')}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.bidHighlight}>
          <View>
            <Text style={styles.bidLabel}>{t('Your Winning Bid')}</Text>
            <Text style={styles.bidAmount}>Rs. {auction.acceptedBid.amount}</Text>
          </View>
        </View>
        
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
            <Text style={styles.label}>{t('Quantity')}</Text>
            <Text style={styles.value}>{auction.sellingQuantity} {t('maunds')}</Text>
          </View>
        </View>
        
        <Pressable
          style={[
            styles.transferButton,
            transferring && styles.transferringButton
          ]}
          onPress={handleTransferAgroCoins}
          disabled={transferring}
        >
          {transferring ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="white" />
              <Text style={styles.transferButtonText}>
                {t('Transfer AgroCoins')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>What happens next?</Text>
        <View style={styles.instructionStep}>
          <MaterialCommunityIcons name="numeric-1-circle" size={24} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Transfer AgroCoins to complete the transaction
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <MaterialCommunityIcons name="numeric-2-circle" size={24} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Contact the farmer to arrange pickup/delivery
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <MaterialCommunityIcons name="numeric-3-circle" size={24} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Receive your purchased crop and enjoy!
          </Text>
        </View>
      </View>
      
      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace('/buyer/AuctionSystemTab')}
      >
        <Text style={styles.cancelButtonText}>
          {t('Return to Auctions')}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, // Add extra padding at the bottom
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 16,
    color: '#555',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: 'white',
  },
  messageContainer: {
    backgroundColor: '#FFC10730',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  congratsMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  profileInfo: {
    marginLeft: 12,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  farmerRating: {
    fontSize: 14,
    color: '#777',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    marginVertical: 12,
  },
  bidHighlight: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  bidLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transferButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferringButton: {
    backgroundColor: '#388E3C',
  },
  transferButtonText: {
    color: 'white', 
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructions: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#FFE0B2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  cancelButtonText: {
    color: '#E65100',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AfterAuctionProcess;