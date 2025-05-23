import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Pressable,
} from "react-native";
import { Text } from "react-native-elements";
import { useTranslation } from "react-i18next";
import { ref, onValue, push, set } from "firebase/database";
import { rtdb, my_auth } from "../../firebaseConfig";
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBuyer } from './hooks/fetch_buyer';

interface AuctionItem {
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
  bids: Array<{
    bidderId: string;
    amount: number;
    timestamp: number;
  }>;
  status: string;
  winningBid?: {
    bidderId: string;
    amount: number;
    timestamp: number;
  };
}

const AuctionSystemTab = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidValues, setBidValues] = useState<Record<string, string>>({});
  const router = useRouter();
  const { profileData } = useBuyer();

  const fetchAuctionItems = useCallback(() => {
    setLoading(true);
    const dbRef = ref(rtdb, "auctions");
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log("Fetched auctions data:", data); // Debug log to see what's being fetched
  
      const items = Object.entries(data).map(([id, value]: [string, any]) => {
        const createdBy = value.createdBy || {};
        const bids = value.bids && typeof value.bids === "object"
          ? Object.values(value.bids).map((bid: any) => ({
              bidderId: bid.bidderId || "",
              amount: Number(bid.amount) || 0,
              timestamp: Number(bid.timestamp) || Date.now()
            }))
          : [];
  
        // Support both price structures
        const startingPrice = Number(value.startingPrice) || 0;
        const totalPrice = Number(value.totalPrice) || 0;
  
        return {
          id,
          cropName: value.cropName || "Unknown",
          startingPrice: startingPrice,
          totalPrice: totalPrice,
          location: value.location || createdBy.city || "Unknown",
          sellingQuantity: value.sellableQuantity?.toString() || "0",
          totalQuantity: value.quantity?.toString() || "0",
          farmerName: createdBy.name || "Unknown",
          farmerPhoto: createdBy.photo || "",
          farmerRating: "4.5",
          createdAt: value.createdAt || Date.now(),
          bids,
          status: value.status || "open",
          winningBid: value.winningBid && typeof value.winningBid === "object"
            ? {
                bidderId: value.winningBid.bidderId || "",
                amount: Number(value.winningBid.amount) || 0,
                timestamp: Number(value.winningBid.timestamp) || Date.now()
              }
            : undefined
        };
      })
      .filter(Boolean); // remove nulls

      console.log("Processed auction items:", items);
      setAuctionItems(items);
      setLoading(false);
    }, {
      onlyOnce: false // Set to false to keep getting updates
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      fetchAuctionItems();
    } catch (error) {
      console.error("Error refreshing auction items:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAuctionItems]);

  useEffect(() => {
    const unsubscribe = fetchAuctionItems();
    return () => unsubscribe();
  }, [fetchAuctionItems]);

  const getHighestBid = (bids?: { amount: number }[]) => {
    if (!bids || bids.length === 0) return 0;
    return Math.max(...bids.map((bid) => bid.amount));
  };
  
  const handlePlaceBid = async (auctionId: string) => {
    const auction = auctionItems.find((item) => item.id === auctionId);
    if (!auction) {
      Alert.alert("Error", "Auction not found");
      return;
    }

    const bidAmount = parseFloat(bidValues[auctionId]);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      Alert.alert("Invalid Bid", "Please enter a valid positive number.");
      return;
    }

    const highestBid = getHighestBid(auction.bids);
    const currentBid = highestBid > 0 ? highestBid : auction.totalPrice;
    
    if (bidAmount <= currentBid) {
      Alert.alert(
        "Bid Too Low",
        `Your bid must be higher than Rs ${currentBid}`
      );
      return;
    }

    const userId = my_auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "You must be logged in to place a bid");
      return;
    }

    try {
      const bidderInfo = {
        bidderId: userId,
        bidderName: profileData?.businessName || "Anonymous Buyer",
        timestamp: Date.now(),
        amount: parseFloat(bidAmount.toString())
      };

      const bidsRef = ref(rtdb, `auctions/${auctionId}/bids`);
      const newBidRef = await push(bidsRef, bidderInfo);

      // Update winning bid with the same bidder information
      const winningBidRef = ref(rtdb, `auctions/${auctionId}/winningBid`);
      await set(winningBidRef, {
        ...bidderInfo,
        bidId: newBidRef.key
      });

      setBidValues((prev) => ({ ...prev, [auctionId]: "" }));
      Alert.alert("Success", "Your bid has been placed successfully!");
    } catch (error) {
      console.error("Error placing bid:", error);
      Alert.alert("Error", "Failed to place bid. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
            title={t("pullToRefresh")}
            titleColor="#4CAF50"
          />
        }
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="store" size={24} color="#3A8A41" />
          <Text style={styles.headerTitle}>{t('Available Auctions')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : auctionItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.noItemsText}>{t("No active auctions found")}</Text>
            <Text style={styles.subText}>{t("Please check back later")}</Text>
          </View>
        ) : (
          auctionItems.map((item) => {
            const highestBid = getHighestBid(item.bids);
            const currentBid = highestBid > 0 ? highestBid : item.totalPrice;

            return (
              <View key={item.id} style={styles.auctionCard}>
                <View style={styles.profileSection}>
                  <Image
                    source={{
                      uri: item.farmerPhoto || 'https://via.placeholder.com/100',
                    }}
                    style={styles.profilePhoto}
                  />
                  <View style={styles.profileInfo}>
                    <Text style={styles.farmerName}>{item.farmerName}</Text>
                    <Text style={styles.farmerRating}>Rating: {item.farmerRating}/5</Text>
                    <Text style={styles.date}>
                      {format(new Date(item.createdAt), 'PPP')}
                    </Text>
                  </View>
                </View>

                <View style={styles.bidHighlight}>
                  <View>
                    <Text style={styles.bidLabel}>{t('Current Bid')}</Text>
                    <Text style={styles.bidAmount}>Rs. {currentBid}</Text>
                  </View>
                  <View>
                    <Text style={styles.bidLabel}>{t('Price per Maund')}</Text>
                    <Text style={styles.startingPrice}>Rs. {item.startingPrice}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>{t('Crop')}</Text>
                    <Text style={styles.value}>{item.cropName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>{t('Location')}</Text>
                    <Text style={styles.value}>{item.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>{t('Selling Quantity')}</Text>
                    <Text style={styles.value}>{item.sellingQuantity} {t('maunds')}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>{t('Total Quantity')}</Text>
                    <Text style={styles.value}>{item.totalQuantity} {t('maunds')}</Text>
                  </View>
                </View>

                <View style={styles.biddingSection}>
                  {item.status === 'closed' && item.winningBid?.bidderId === my_auth.currentUser?.uid ? (
                    <Pressable
                      style={styles.processButton}
                      onPress={() => {
                        const bidRef = ref(rtdb, `auctions/${item.id}/bids`);
                        onValue(bidRef, (snapshot) => {
                          const bids = snapshot.val();
                          if (bids) {
                            // Find the accepted bid
                            const acceptedBid = Object.entries(bids).find(([_, bid]: [string, any]) => 
                              bid.bidderId === my_auth.currentUser?.uid && 
                              bid.amount === item.winningBid?.amount
                            );
                            
                            if (acceptedBid) {
                              const [bidId] = acceptedBid;
                              // Update the bid status to accepted
                              const bidStatusRef = ref(rtdb, `auctions/${item.id}/bids/${bidId}/status`);
                              set(bidStatusRef, 'accepted').then(() => {
                                router.push({
                                  pathname: '/buyer/AfterAuctionProcess',
                                  params: { auctionId: item.id }
                                });
                              });
                            } else {
                              Alert.alert("Error", "Could not find your bid details");
                            }
                          }
                        }, {
                          onlyOnce: true
                        });
                      }}
                    >
                      <Text style={styles.processButtonText}>
                        {t("Process Payment")}
                      </Text>
                    </Pressable>
                  ) : item.status === 'closed' ? (
                    <Text style={styles.auctionClosedText}>
                      {t("Auction Closed")}
                    </Text>
                  ) : (
                    <>
                      <TextInput
                        placeholder={t("Enter Your Bid Amount")}
                        style={styles.input}
                        keyboardType="numeric"
                        value={bidValues[item.id] || ""}
                        onChangeText={(text) =>
                          setBidValues((prev) => ({ ...prev, [item.id]: text }))
                        }
                      />
                      <Pressable
                        style={styles.bidButton}
                        onPress={() => handlePlaceBid(item.id)}
                      >
                        <Text style={styles.bidButtonText}>
                          {t("Place Bid")}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { flexGrow: 1, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  auctionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
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
  statusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bidHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  bidLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32', // Dark green for emphasis
    flexShrink: 1, // Allow text to shrink if needed
  },
  startingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#555',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  biddingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  bidButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bidButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  noItemsText: {
    textAlign: "center",
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
  },
  subText: {
    textAlign: "center",
    fontSize: 14,
    color: "#888",
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  timeLeftContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  timeLeftText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  processButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  processButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  auctionClosedText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    width: '100%',
    paddingVertical: 12,
  },
});

export default AuctionSystemTab;