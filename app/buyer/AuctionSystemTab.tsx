import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Card, Text, Button } from "react-native-elements";
import { useTranslation } from "react-i18next";
import { ref, onValue, update, push } from "firebase/database";
import { rtdb, my_auth } from "../../firebaseConfig";

interface AuctionItem {
  id: string;
  cropName: string;
  quantity: number;
  startingPrice: number;
  location: string;
  bids?: {
    bidderId: string;
    amount: number;
    timestamp: number;
  }[];
}

const AuctionSystemTab = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidValues, setBidValues] = useState<Record<string, string>>({});

  const fetchAuctionItems = useCallback(async () => {
    setLoading(true);
    const dbRef = ref(rtdb, "auctions");
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.entries(data).map(([key, value]: any) => ({
        id: key,
        ...value,
      }));
      setAuctionItems(items);
      setLoading(false);
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAuctionItems();
    } catch (error) {
      console.error("Error refreshing auction items:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAuctionItems]);

  useEffect(() => {
    fetchAuctionItems();
  }, [fetchAuctionItems]);

  const handlePlaceBid = async (auctionId: string) => {
    const bidAmount = parseFloat(bidValues[auctionId]);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      Alert.alert("Invalid Bid", "Please enter a valid positive number.");
      return;
    }

    const auction = auctionItems.find((item) => item.id === auctionId);
    const bids = auction?.bids || [];
    const highestBid = getHighestBid(bids) || auction?.startingPrice || 0;

    if (bidAmount <= highestBid) {
      Alert.alert(
        "Bid Too Low",
        `Your bid must be higher than Rs ${highestBid}`
      );
      return;
    }

    const userId = my_auth.currentUser?.uid;
    if (!userId) return;

    const bid = {
      bidderId: userId,
      amount: bidAmount,
      timestamp: Date.now(),
    };

    const bidsRef = ref(rtdb, `auctions/${auctionId}/bids`);
    push(bidsRef, bid);

    const updatedAuctionItems = auctionItems.map((item) => {
      if (item.id === auctionId) {
        const updatedBids = [...(item.bids || []), bid];
        const updatedHighestBid = getHighestBid(updatedBids);
        return { ...item, bids: updatedBids, highestBid: updatedHighestBid };
      }
      return item;
    });
    setAuctionItems(updatedAuctionItems);

    setBidValues((prev) => ({ ...prev, [auctionId]: "" }));
  };

  const getHighestBid = (
    bids?:
      | {
          [key: string]: {
            amount: number;
            bidderId: string;
            timestamp: number;
          };
        }
      | { bidderId: string; amount: number; timestamp: number }[]
  ) => {
    if (!bids) return 0; // If no bids exist, return 0

    // If bids is an array, map over it to extract the amounts
    const bidAmounts = Array.isArray(bids)
      ? bids.map((bid) => bid.amount)
      : Object.values(bids).map((bid) => bid.amount);

    // If there are no bids, return 0
    if (bidAmounts.length === 0) return 0;

    // Return the highest bid
    return Math.max(...bidAmounts);
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
        <Text style={styles.title}>{t("auctionSystem")}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : auctionItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.noItemsText}>{t("noAuctionsFound")}</Text>
            <Text style={styles.subText}>{t("pleaseCheckBackLater")}</Text>
          </View>
        ) : (
          auctionItems.map((item) => {
            const highestBid = getHighestBid(item.bids);
            return (
              <Card key={item.id} containerStyle={styles.auctionCard}>
                <Card.Title>{item.cropName}</Card.Title>
                <Card.Divider />
                <Text>
                  {t("Quantity")}: {item.quantity}
                </Text>
                <Text>
                  {t("Location")}: {item.location}
                </Text>
                <Text>
                  {t("Starting Price")}: Rs {item.startingPrice}
                </Text>
                <Text style={styles.bidInfo}>
                  {t("Highest Bid")}: Rs {highestBid || item.startingPrice}
                </Text>

                <TextInput
                  placeholder={t("Enter Your Bid Amount")}
                  style={styles.input}
                  keyboardType="numeric"
                  value={bidValues[item.id] || ""}
                  onChangeText={(text) =>
                    setBidValues((prev) => ({ ...prev, [item.id]: text }))
                  }
                />
                <Button
                  title={t("Place Bid")}
                  buttonStyle={styles.bidButton}
                  onPress={() => handlePlaceBid(item.id)}
                />
              </Card>
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
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4CAF50",
  },
  bidInfo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginVertical: 8,
  },
  bidButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#fff",
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
});

export default AuctionSystemTab;
