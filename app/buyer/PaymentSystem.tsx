import React, { useState, useEffect } from "react";
import { CardField, useStripe, initStripe, CardFieldInput } from "@stripe/stripe-react-native";
import axios from "axios";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SERVER_URL } from "../utils/constants"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { db, my_auth } from "../../firebaseConfig";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useBuyer } from "./hooks/fetch_buyer";

export default function PaymentSystem() {
  const stripe = useStripe();
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { profileData } = useBuyer();

  useEffect(() => {
    initStripe({
      publishableKey:
        "pk_test_51RNxID2KOKcFcnrUEk3nha8UJC3zcmB3AXiUdy2jkc5CX1TT9ZZvaH75oe2Jakobj4bYRxdi3zP7HFxl03bxaxST00Y1XA05W6",
    });
  }, []);

  const createPaymentRecord = async (paymentIntent: any) => {
    try {
      const user = my_auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch the latest buyer data directly
      const buyerRef = doc(db, 'buyer', user.uid);
      const buyerDoc = await getDoc(buyerRef);
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;

      if (!buyerData) {
        throw new Error('Buyer profile not found');
      }

      // Create payment record in payments collection
      const paymentData = {
        userId: user.uid,
        role: 'buyer',
        name: buyerData.businessName || 'Anonymous Buyer',
        paymentStatus: 'successful',
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        paymentId: paymentIntent.id,
        timestamp: serverTimestamp(),
        transactionDetails: {
          currency: paymentIntent.currency,
          paymentMethod: 'card',
          status: paymentIntent.status,
          cardBrand: cardDetails?.brand || 'unknown',
          last4: cardDetails?.last4 || 'xxxx'
        },
        metadata: {
          businessType: buyerData.businessType || 'unknown',
          phoneNumber: buyerData.phoneNumber || 'unknown',
          address: buyerData.address || 'unknown'
        }
      };

      // Add to payments collection
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('Payment record created with ID:', paymentRef.id);

      // Update user's payment history in their profile
      await setDoc(buyerRef, {
        lastPayment: {
          status: 'successful',
          timestamp: serverTimestamp(),
          amount: paymentIntent.amount / 100,
          paymentId: paymentRef.id
        },
        totalPayments: (buyerData.totalPayments || 0) + 1
      }, { merge: true });

      return paymentRef.id;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!stripe) {
      Toast.show({ type: "error", text1: "Stripe not initialized" });
      return;
    }

    setLoading(true);
    try {
      console.log("Processing payment...")
      const { data } = await axios.post("http://10.135.54.24:5000/api/payment", {
        amount: 1000,
        currency: "usd",
      });

      const clientSecret = data.clientSecret;

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {}, // Add billing info if required
        },
      });

      if (confirmError) {
        console.log("Payment confirmation error:", confirmError);
        Toast.show({ type: "error", text1: confirmError.message });
        return;
      }

      // Create payment record in Firebase
      const paymentRecordId = await createPaymentRecord(paymentIntent);
      console.log('Payment record created successfully:', paymentRecordId);

      Toast.show({ type: "success", text1: "Payment Successful" });
      
      // Navigate back to dashboard after successful payment
      setTimeout(() => {
        router.replace("/buyer/dashboard");
      }, 1500); // Give time for the success toast to be visible

    } catch (err: any) {
      console.log("Payment error:", err);
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.heading}>Payment</Text>
      </View> */}

      <Text style={styles.description}>
        Complete your payment securely and quickly. Enter your card details below to proceed.
      </Text>

      <CardField
        postalCodeEnabled={false}
        placeholders={{
          number: "4242 4242 4242 4242"
        }}
        cardStyle={{
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
        }}
        style={styles.cardContainer}
        onCardChange={(cardDetails) => {
          setCardDetails(cardDetails);
        }}
      />

      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? "Processing..." : "Pay"}
        </Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  heading: {
    fontSize: 28,
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    height: 50,
    marginVertical: 30,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 5,
  },
  payButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
