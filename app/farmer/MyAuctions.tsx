import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";

// Define auction type
interface Auction {
  id: string;
  cropName: string;
  quantity: number | string;
  startingPrice: number | string;
  location: string;
  createdBy?: {
    farmerId: string;
    [key: string]: any;
  };
}

const MyAuctions = () => {
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const { t } = useTranslation();
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auctionsRef = ref(rtdb, "auctions");
    const unsubscribe = onValue(auctionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const filtered = Object.entries(data)
        .filter(
          ([_, auction]: [string, any]) =>
            auction.createdBy?.farmerId === farmerId
        )
        .map(([key, auction]: [string, any]) => ({ id: key, ...auction }));
      setMyAuctions(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [farmerId]);

  const renderItem: ListRenderItem<Auction> = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.crop}>{item.cropName}</Text>
      <Text>
        {t("Quantity")}: {item.quantity} Maund
      </Text>
      <Text>
        {t("Starting Price")}: Rs. {item.startingPrice}
      </Text>
      <Text>
        {t("Location")}: {item.location}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t("Auctions")}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : myAuctions.length === 0 ? (
        <Text style={styles.noData}>{t("noAuctionsFound")}</Text>
      ) : (
        <FlatList
          data={myAuctions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4CAF50",
  },
  noData: { fontSize: 16, color: "#888", marginTop: 30, textAlign: "center" },
  card: {
    padding: 15,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  crop: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
});

export default MyAuctions;
