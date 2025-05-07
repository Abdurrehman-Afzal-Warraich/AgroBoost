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

const AuctionPreview = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const handleEdit = () => {
    router.back();
  };

  const handleAdd = () => {
    // TODO: Implement final add to auction logic
    console.log("Adding auction to system:", params);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Preview of Crop for Auction</Text>

      <View style={styles.previewBox}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Farmer Name:</Text>
          <Text style={styles.value}>{params.farmerName || "N/A"}</Text>
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
          <Text style={styles.value}>{params.quantity} Maunds</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Starting Price:</Text>
          <Text style={styles.value}>Rs. {params.startingPrice}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{params.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Auction Duration:</Text>
          <Text style={styles.value}>5 minutes</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleEdit}>
          <Text style={styles.buttonText}>Edit</Text>
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
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AuctionPreview;
