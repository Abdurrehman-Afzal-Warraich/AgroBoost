import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { ref, onValue, set, update } from "firebase/database";
import { format } from "date-fns";
import { rtdb } from "../../../firebaseConfig";
import { useRouter } from "expo-router";

interface Bid {
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
  status?: "pending" | "accepted" | "rejected";
}

const AuctionBids = ({ auctionId }: { auctionId: string }) => {
  const [bids, setBids] = useState<{ id: string; data: Bid }[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<"open" | "closed">("open");
  const router = useRouter();

  useEffect(() => {
    // Fetch bids from the database
    const bidsRef = ref(rtdb, `auctions/${auctionId}/bids`);
    const bidsUnsubscribe = onValue(bidsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const bidsArray = Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        data: value as Bid,
      }));
      setBids(bidsArray);
    });

    // Listen for auction status changes
    const auctionRef = ref(rtdb, `auctions/${auctionId}/status`);
    const statusUnsubscribe = onValue(auctionRef, (snapshot) => {
      const status = snapshot.val();
      if (status === "closed") {
        setAuctionStatus("closed");
      } else {
        setAuctionStatus("open");
      }
    });

    // Cleanup listeners on unmount
    return () => {
      bidsUnsubscribe();
      statusUnsubscribe();
    };
  }, [auctionId]);

  const updateBidStatus = async (bidId: string, status: "accepted" | "rejected") => {
    if (status === "accepted") {
      Alert.alert(
        "Confirm Acceptance",
        "Are you sure you want to accept this bid? This will close the auction for all buyers.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes, Accept Bid",
            onPress: async () => {
              try {
                const winningBid = bids.find((bid) => bid.id === bidId);
                
                // Set winning bid info
                const winningBidRef = ref(rtdb, `auctions/${auctionId}/winningBid`);
                await set(winningBidRef, {
                  bidId,
                  bidderId: winningBid?.data.bidderId,
                  bidderName: winningBid?.data.bidderName,
                  amount: winningBid?.data.amount,
                });

                // Update auction status to closed
                const statusRef = ref(rtdb, `auctions/${auctionId}/status`);
                await set(statusRef, "closed");

                // Navigate immediately
                router.replace(`/farmer/auction/FarmerAfterAuction?auctionId=${auctionId}&bidId=${bidId}`);
              } catch (error) {
                console.error("Error in bid acceptance:", error);
                router.replace(`/farmer/auction/FarmerAfterAuction?auctionId=${auctionId}&bidId=${bidId}`);
              }
            },
          },
        ]
      );
    } else {
      // If rejecting a bid (no confirmation needed)
      try {
        const bidRef = ref(rtdb, `auctions/${auctionId}/bids/${bidId}/status`);
        await set(bidRef, "rejected");
        
        // Notify the bidder about rejection
        const rejectedBid = bids.find(bid => bid.id === bidId);
        if (rejectedBid && rejectedBid.data.bidderId) {
          const notificationRef = ref(rtdb, `notifications/${rejectedBid.data.bidderId}/${Date.now()}`);
          await set(notificationRef, {
            type: "bid_rejected",
            auctionId: auctionId,
            message: "Your bid was not accepted. You can try again on other auctions.",
            timestamp: Date.now(),
            read: false
          });
        }
      } catch (error) {
        console.error("Error updating bid status:", error);
        Alert.alert("Error", "Failed to update bid status. Please try again.");
      }
    }
  };

  return (
    <View style={styles.bidsSection}>
      <Text style={styles.bidsTitle}>Bids Received</Text>
      {auctionStatus === "closed" ? (
        <Text style={styles.auctionClosed}>
          This auction has been closed. No more bids can be accepted.
        </Text>
      ) : bids.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#666", marginTop: 16 }}>
          No bids yet.
        </Text>
      ) : (
        bids.map(({ id, data }) => (
          <View key={id} style={styles.bidCard}>
            <Text style={styles.bidderName}>👤 {data.bidderName || "Unknown Buyer"}</Text>
            <Text style={styles.bidAmount}>💰 Rs. {data.amount}</Text>
            <Text style={styles.bidTime}>
              🕒 {format(new Date(data.timestamp), "PPPpp")}
            </Text>
            <Text style={styles.bidStatus}>
              Status:{" "}
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      data.status === "accepted"
                        ? "#4CAF50" // Green for accepted
                        : data.status === "rejected"
                        ? "#F44336" // Red for rejected
                        : "#FFC107", // Yellow for pending
                  },
                ]}
              >
                {data.status || "Pending"}
              </Text>
            </Text>

            {/* Only show actions if bid is still pending and auction is open */}
            {(data.status === undefined || data.status === "pending") &&
            auctionStatus === "open" ? (
              <View style={styles.bidActions}>
                <Text
                  onPress={() => updateBidStatus(id, "accepted")}
                  style={styles.accept}
                >
                  ✅ Accept
                </Text>
                <Text
                  onPress={() => updateBidStatus(id, "rejected")}
                  style={styles.reject}
                >
                  ❌ Reject
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bidsSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bidsTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: "#4CAF50", // Green title
    textAlign: "center",
    paddingVertical: 8,
    backgroundColor: "#FFC107", // Yellow background
    borderRadius: 8,
    overflow: "hidden",
  },
  bidCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  bidTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  bidStatus: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusText: {
    fontWeight: "bold",
  },
  bidActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  accept: {
    color: "#4CAF50",
    fontWeight: "bold",
    padding: 8,
  },
  reject: {
    color: "#F44336",
    fontWeight: "bold",
    padding: 8,
  },
  auctionClosed: {
    textAlign: "center",
    color: "#F44336",
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
});

export default AuctionBids;