import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useFarmer } from "../hooks/fetch_farmer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { rtdb, my_auth } from "../../firebaseConfig.js";
import { ref, push, set } from "firebase/database";
import { useUser } from "../context/UserProvider";

const AuctionSystem = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { farmerData } = useFarmer();
  const { userName, email, city } = useUser();
  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    startingPrice: "",
    location: farmerData?.city || "",
  });
  const [errors, setErrors] = useState({
    cropName: "",
    quantity: "",
    startingPrice: "",
    location: "",
  });

  const validateForm = () => {
    const newErrors = {
      cropName: "",
      quantity: "",
      startingPrice: "",
      location: "",
    };

    if (!formData.cropName.trim()) {
      newErrors.cropName = t("error.cropNameRequired");
    }
    if (!formData.quantity.trim()) {
      newErrors.quantity = t("error.quantityRequired");
    } else if (
      isNaN(Number(formData.quantity)) ||
      Number(formData.quantity) <= 0
    ) {
      newErrors.quantity = t("error.invalidQuantity");
    }
    if (!formData.startingPrice.trim()) {
      newErrors.startingPrice = t("error.priceRequired");
    } else if (
      isNaN(Number(formData.startingPrice)) ||
      Number(formData.startingPrice) <= 0
    ) {
      newErrors.startingPrice = t("error.invalidPrice");
    }
    if (!formData.location.trim()) {
      newErrors.location = t("error.locationRequired");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handlePreview = () => {
    router.push({
      pathname: "/farmer/AuctionPreview",
      params: {
        ...formData,
        farmerName: farmerData?.name || "",
        farmerId: my_auth.currentUser?.uid || "",
      },
    });
  };

  const handleAdd = async () => {
    if (!validateForm()) {
      Alert.alert(t("error.formValidationError"));
      return;
    }

    try {
      const auctionRef = ref(rtdb, "auctions");
      const newAuctionRef = push(auctionRef);
      await set(newAuctionRef, {
        cropName: formData.cropName,
        quantity: Number(formData.quantity),
        startingPrice: Number(formData.startingPrice),
        location: formData.location,
        createdAt: Date.now(),
        createdBy: {
          userName,
          email,
          city,
          farmerId: my_auth.currentUser?.uid || "",
        },
        bids: [],
      });

      Alert.alert(t("success"), t("auctionAddedSuccessfully"));

      // Reset form
      setFormData({
        cropName: "",
        quantity: "",
        startingPrice: "",
        location: farmerData?.city || "",
      });

      // Navigate to /farmer/dashboard
      router.push("/farmer/dashboard");
    } catch (error) {
      console.error("Error adding auction:", error);
      Alert.alert(t("error"), t("error.addingAuction"));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="gavel" size={40} color="#4CAF50" />
        <Text style={styles.heading}>{t("Add Auction")}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t("cropName")}</Text>
        <TextInput
          style={[styles.input, errors.cropName ? styles.inputError : null]}
          value={formData.cropName}
          onChangeText={(value) => handleInputChange("cropName", value)}
          placeholder={t("enterCropName")}
        />
        {errors.cropName ? (
          <Text style={styles.errorText}>{errors.cropName}</Text>
        ) : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t("quantity")}</Text>
        <TextInput
          style={[styles.input, errors.quantity ? styles.inputError : null]}
          value={formData.quantity}
          onChangeText={(value) => handleInputChange("quantity", value)}
          placeholder={t("enterQuantity")}
          keyboardType="numeric"
        />
        {errors.quantity ? (
          <Text style={styles.errorText}>{errors.quantity}</Text>
        ) : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t("startingPrice")}</Text>
        <TextInput
          style={[
            styles.input,
            errors.startingPrice ? styles.inputError : null,
          ]}
          value={formData.startingPrice}
          onChangeText={(value) => handleInputChange("startingPrice", value)}
          placeholder={t("enterStartingPrice")}
          keyboardType="numeric"
        />
        {errors.startingPrice ? (
          <Text style={styles.errorText}>{errors.startingPrice}</Text>
        ) : null}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t("location")}</Text>
        <TextInput
          style={[styles.input, errors.location ? styles.inputError : null]}
          value={formData.location}
          onChangeText={(value) => handleInputChange("location", value)}
          placeholder={t("enterLocation")}
        />
        {errors.location ? (
          <Text style={styles.errorText}>{errors.location}</Text>
        ) : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={handleAdd}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t("Add")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.previewButton]}
          onPress={handlePreview}
        >
          <MaterialCommunityIcons name="eye" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t("Preview")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.myAuctionsButton]}
        onPress={() =>
          router.push({
            pathname: "/farmer/MyAuctions",
            params: { farmerId: my_auth.currentUser?.uid || "" },
          })
        }
      >
        <MaterialCommunityIcons name="list-status" size={24} color="#fff" />
        <Text style={styles.buttonText}>{t("My Auctions")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#4CAF50",
  },
  myAuctionsButton: {
    backgroundColor: "#2196F3",
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#FF5252",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
  },
  previewButton: {
    backgroundColor: "#FFC107",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default AuctionSystem;
