import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import YieldEstimateCard from './YieldPrediction/YieldEstimateCard';
import { type YieldPredictionData } from './YieldPrediction/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useFields } from '../hooks/useFields';
import { useFarmer } from '../hooks/fetch_farmer';
import { CITY_MAPPING, ensureCityType, ensureDate } from './YieldPrediction/types';

const AuctionSystem = () => {
  console.log("AuctionSystem component mounted");
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { fields, loading: fieldsLoading } = useFields();
  const { farmerData, loading: farmerLoading } = useFarmer();
  const isRTL = i18n.language === "ur";
  
  const [peracreYield, setPeracreYield] = useState(0);
  const [predictionData, setPredictionData] = useState<YieldPredictionData | null>(null);
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);

  useEffect(() => {
    fetchPredictionData();
    fetchFarmerAuctions();
  }, [fields, farmerData]);

  const fetchPredictionData = async () => {
    if (fieldsLoading || farmerLoading) return;
    
    setLoadingPredictions(true);
    
    try {
      if (!fields || fields.length === 0) {
        console.log("No fields found");
        setLoadingPredictions(false);
        return;
      }
      
      // Find wheat field
      const wheatField = fields.find((field) => field.cropType.toLowerCase() === "wheat");
      
      if (!wheatField) {
        console.log("No wheat field found");
        setLoadingPredictions(false);
        return;
      }
      
      // Get city from farmer data
      const city = farmerData ? ensureCityType(farmerData.city) : "Lahore";
      
      // Fetch prediction data from Firestore
      const predictionRef = doc(db, "fields", wheatField.id, "predictions", "current");
      const predictionDoc = await getDoc(predictionRef);
      
      if (predictionDoc.exists()) {
        const data = predictionDoc.data() as YieldPredictionData;
        const sowingDate = ensureDate(data.sowingDate);
        
        // Add city average using the CITY_MAPPING
        const cityAverage = CITY_MAPPING[city];
        const totalCityAverage = cityAverage * Number(wheatField.areaInAcres);
        
        // Format prediction history
        const formattedHistory = data.predictionHistory ? 
          data.predictionHistory.map(history => ({
            ...history,
            date: history.date instanceof Date ? history.date : new Date(history.date),
          })) : [];
        
        // Update state with actual prediction data
        setPredictionData({
          ...data,
          sowingDate: sowingDate,
          cityAverage: cityAverage,
          totalCityAverage: totalCityAverage,
          city: city,
          soilType: data.soilType || wheatField.soilType,
          predictionHistory: formattedHistory,
        });
        
        // Update per-acre yield
        if (data.predictedYield && wheatField.areaInAcres) {
          const calculatedYield = data.predictedYield / Number(wheatField.areaInAcres);
          setPeracreYield(calculatedYield);
        }
      } else {
        console.log("No prediction data found for this field");
      }
    } catch (error) {
      console.error("Error fetching prediction data:", error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchFarmerAuctions = () => {
    if (!user?.uid) return;

    setLoadingAuctions(true);
    const auctionsRef = ref(rtdb, 'auctions');
    
    onValue(auctionsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setHasActiveAuction(false);
        setLoadingAuctions(false);
        return;
      }

      const activeAuctions = Object.values(data).filter((auction: any) => 
        auction.createdBy?.farmerId === user.uid && 
        (!auction.status || auction.status === 'active')
      );

      setHasActiveAuction(activeAuctions.length > 0);
      setLoadingAuctions(false);
    });
  };

  const handleAddToAuction = () => {
    if (predictionData) {
      router.push({
        pathname: '/farmer/auction/AuctionFormModal',
        params: {
          cropName: predictionData.cropType,
          quantity: predictionData.predictedYield.toString(),
          location: predictionData.city,
        },
      });
    }
  };

  const handleViewAuctions = () => {
    router.push('/farmer/auction/dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loadingPredictions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A8A41" />
          </View>
        ) : predictionData ? (
          <YieldEstimateCard
            predictionData={predictionData}
            peracreYield={peracreYield}
            isRTL={isRTL}
            t={t}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>{t("No prediction data available")}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.auctionButton, 
            isRTL && styles.rtlRow,
            (hasActiveAuction || loadingAuctions || !predictionData) && styles.disabledButton
          ]}
          onPress={handleAddToAuction}
          disabled={hasActiveAuction || loadingAuctions || !predictionData}
        >
          <MaterialCommunityIcons 
            name="gavel" 
            size={20} 
            color={hasActiveAuction || !predictionData ? "#AAAAAA" : "#FFFFFF"} 
          />
          <Text style={[
            styles.auctionButtonText,
            (hasActiveAuction || !predictionData) && styles.disabledText
          ]}>
            {t("Add to Auction")}
            {hasActiveAuction && ` (${t("Active auction exists")})`}
            {!predictionData && !hasActiveAuction && ` (${t("No prediction data")})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewAuctionsButton, isRTL && styles.rtlRow]}
          onPress={handleViewAuctions}
        >
          <MaterialCommunityIcons name="view-list" size={20} color="#FFFFFF" />
          <Text style={styles.auctionButtonText}>{t("View My Auction")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  auctionButton: {
    backgroundColor: "#3A8A41",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  viewAuctionsButton: {
    backgroundColor: "#FFC107",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  auctionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  disabledText: {
    color: "#AAAAAA",
  },
});

export default AuctionSystem;