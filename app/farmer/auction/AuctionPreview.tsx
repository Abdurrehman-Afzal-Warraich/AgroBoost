import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useFarmer } from "../../hooks/fetch_farmer";
import { ref, push, set } from 'firebase/database';
import { rtdb } from '@/firebaseConfig'; // or wherever your config is
import { query, orderByChild, equalTo, get } from "firebase/database";
import { Alert } from "react-native"; 

const AuctionPreview = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { farmerData, loading: farmerLoading } = useFarmer();

  const handleEdit = () => {
    router.back();
  };

  const handleAdd = async () => {
    if (!user || !farmerData) {
      console.warn("Missing user or farmerData");
      return;
    }
  
    try {
      // Step 1: Check if auction already exists for this farmer
      const auctionsRef = ref(rtdb, 'auctions');
      const q = query(auctionsRef, orderByChild("createdBy/farmerId"), equalTo(user.uid));
      const snapshot = await get(q);
  
      if (snapshot.exists()) {
        Alert.alert(
          "Auction Already Exists",
          "You already have an auction. Please finish or remove it before creating a new one."
        );
        return;
      }

      // Calculate start and end times
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (Number(params.duration) * 60 * 1000));

      const auctionData = {
        cropName: params.cropName,
        quantity: Number(params.totalQuantity),
        sellableQuantity: Number(params.sellableQuantity),
        startingPrice: Number(params.startingPrice),
        totalPrice: Number(params.totalPrice),
        location: params.location || farmerData.city,
        duration: Number(params.duration),
        createdAt: startTime.getTime(),
        createdBy: {
          name: farmerData.name,
          city: farmerData.city,
          email: user.email,
          farmerId: user.uid,
        },
      };

      const newAuctionRef = await push(auctionsRef, auctionData);
      console.log("✅ Auction submitted to Firebase");

      router.push("/farmer/auction/dashboard");
    } catch (err) {
      console.error("❌ Failed to submit auction:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Preview of Crop for Auction</Text>

      <View style={styles.previewBox}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Farmer Name:</Text>
          <Text style={styles.value}>{farmerData?.name || "N/A"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Farmer's Rating:</Text>
          <Text style={styles.value}>4.5/5</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Crop Name:</Text>
          <Text style={styles.value}>{params.cropName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{params.totalQuantity} Maunds</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Sellable Quantity:</Text>
          <Text style={styles.value}>{params.sellableQuantity} Maunds</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Price per Maund:</Text>
          <Text style={styles.value}>Rs. {params.startingPrice}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Starting Price:</Text>
          <Text style={styles.value}>Rs. {params.totalPrice}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{farmerData?.city}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Auction Duration:</Text>
          <Text style={styles.value}>{params.duration} Minutes</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleEdit}>
          <Text style={styles.buttonText}>{t("Edit")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={handleAdd}
        >
          <Text style={styles.buttonText}>{t("Add")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#4CAF50",
  },
  previewBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#FFC107",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "red",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AuctionPreview;
