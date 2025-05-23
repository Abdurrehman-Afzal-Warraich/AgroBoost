import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, View, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { type FieldData, useFields } from "../../hooks/useFields"
import { useFarmer } from "../../hooks/fetch_farmer"
import Toast from "../../components/Toast"
import { getAuth } from "firebase/auth"
import EmptyState from "./EmptyState"
import FieldDetailsCard from "./FieldDetailsCard"
import YieldEstimateCard from "./YieldEstimateCard"
import YieldForecastChart from "./YieldForecastChart"
import PredictionControls from "./PredictionControls"
import PredictionHistory from "./PredictionHistory"
import MapSection from "./MapSection"
import HeaderSection from "./HeaderSection"
import { FASTAPI_URL } from "@/app/utils/constants"
import { type YieldPredictionData, type BackendPredictionRequest, type BackendPredictionResponse, type CityType, CITY_MAPPING, ensureCityType, ensureDate } from "./types"
import { set } from "date-fns"


const YieldPredictionComponent = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { fields, loading: fieldsLoading } = useFields()
  const { farmerData, loading: farmerLoading } = useFarmer()
  const [wheatField, setWheatField] = useState<FieldData | null>(null)
  const [predictionData, setPredictionData] = useState<YieldPredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [peracreYield, setPeracreYield] = useState(0)
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean
    message: string
    type: "success" | "error" | "info"
  }>({
    visible: false,
    message: "",
    type: "error",
  })

  const isRTL = i18n.language === "ur"

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastConfig({
      visible: true,
      message,
      type,
    })
  }

  const hideToast = () => {
    setToastConfig((prev) => ({ ...prev, visible: false }))
  }

const fetchPredictionFromBackend = async (data: BackendPredictionRequest): Promise<number> => {
  console.log("Sending prediction request to backend with data:", data);

  const response = await fetch(`${FASTAPI_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'API request failed');
  }

  const result = await response.json() as BackendPredictionResponse;

  const predictedYield = parseFloat(result.predicted_yield);
  const roundedYield = Math.round((predictedYield + Number.EPSILON) * 100) / 100; // Proper rounding

  console.log("Received prediction response from backend:", roundedYield);
  setPeracreYield(roundedYield);
  console.log("Per acre yield set to:", roundedYield);

  return roundedYield;
};


// Add utility function to format dates
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Update function to calculate days since sowing based on round number
const calculateDaysSinceSowing = (round: number): number => {
  return round * 15; // Each round is 15 days
};

// Update function to calculate next prediction date based on sowing date and round
const calculatePredictionParams = (sowingDate: Date, currentRound: number): {
  timestamp: Date;
  days_since_sowing: number;
  interval_number: number;
} => {
  const days_since_sowing = calculateDaysSinceSowing(currentRound + 1); // Add 1 for next round
  const timestamp = new Date(sowingDate);
  timestamp.setDate(timestamp.getDate() + days_since_sowing); // Add days to sowing date
  
  return {
    timestamp,
    days_since_sowing,
    interval_number: currentRound + 1
  };
};


  const initializeData = useCallback(async () => {
    if (dataInitialized || fieldsLoading || farmerLoading) return;

    if (fields && fields.length > 0 && farmerData) {
      console.log("Fields data received:", fields);
      const wheatFieldData = fields.find((field) => field.cropType.toLowerCase() === "wheat");

      if (wheatFieldData) {
        console.log("Found wheat field:", wheatFieldData);
        setWheatField(wheatFieldData);

        // Get city from farmer data
        const city = ensureCityType(farmerData.city);

        // Pass wheatFieldData directly to fetchYieldPrediction
        await fetchYieldPrediction(wheatFieldData.id, city, wheatFieldData);
        setDataInitialized(true);
      } else {
        console.log("No wheat field found in fields data");
        setWheatField(null);
        setIsLoading(false);
        setDataInitialized(true);
      }
    } else if (!fieldsLoading && !farmerLoading) {
      // If fields are loaded but empty
      setIsLoading(false);
      setDataInitialized(true);
    }
  }, [fields, fieldsLoading, farmerData, farmerLoading, dataInitialized]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Reset dataInitialized when component unmounts
  useEffect(() => {
    return () => {
      setDataInitialized(false);
    };
  }, []);

  const fetchYieldPrediction = async (fieldId: string, city: CityType, fieldData?: FieldData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in to view predictions");
      }

      if (!fieldId) {
        throw new Error("Field ID is required");
      }

      // Use the passed fieldData or fall back to wheatField state
      const currentFieldData = fieldData || wheatField;

      if (!currentFieldData) {
        throw new Error("No wheat field data available");
      }

      // Fetch from fields/{fieldId}/predictions/current
      const predictionRef = doc(db, "fields", fieldId, "predictions", "current");
      const predictionDoc = await getDoc(predictionRef);

      if (predictionDoc.exists()) {
        const data = predictionDoc.data() as YieldPredictionData;
        const sowingDate = ensureDate(data.sowingDate);
        const days_since_sowing = calculateDaysSinceSowing(data.currentRound);

        // Add city average using the CITY_MAPPING
        const cityAverage = CITY_MAPPING[city];
        const totalCityAverage = cityAverage * Number(currentFieldData.areaInAcres);

        setPredictionData({
          ...data,
          sowingDate: sowingDate,
          cityAverage: cityAverage,
          totalCityAverage: totalCityAverage,
          city: city,
          soilType: data.soilType || currentFieldData.soilType,
          daysRemaining: Math.max(0, 15 - (days_since_sowing % 15)), // Days until next 15-day interval
          currentRound: data.currentRound,
          predictionHistory: data.predictionHistory.map((history) => ({
            ...history,
            date: history.date instanceof Timestamp ? history.date.toDate() : history.date,
          })),
        });
      } else {
        // Initialize with sample data for new prediction
        const sowingDate = ensureDate(currentFieldData.sowingDate);
        const days_since_sowing = calculateDaysSinceSowing(currentFieldData.currentRound);
        const currentRound = currentFieldData.currentRound;

        // Get city average from CITY_MAPPING
        const cityAverage = CITY_MAPPING[city];
        const totalCityAverage = cityAverage * Number(currentFieldData.areaInAcres);

        const sampleData: YieldPredictionData = {
          fieldId: fieldId,
          fieldSize: Number(currentFieldData.areaInAcres),
          cropType: "Wheat",
          sowingDate: sowingDate,
          latitude: currentFieldData.latitude || 0,
          longitude: currentFieldData.longitude || 0,
          daysRemaining: Math.max(0, 15 - (days_since_sowing % 15)), // Days until next 15-day interval
          currentRound: currentRound,
          predictedYield: 0, // Will be set after first prediction
          cityAverage: cityAverage,
          totalCityAverage: totalCityAverage,
          city: city,
          soilType: currentFieldData.soilType || "Unknown",
          predictionHistory: [],
        };

        try {
          await setDoc(predictionRef, {
            ...sampleData,
            sowingDate: Timestamp.fromDate(sowingDate),
            predictionHistory: [],
          });
          setPredictionData(sampleData);
          showToast(t("Initial prediction data created successfully"), "success");
        } catch (error) {
          console.error("Error creating initial prediction:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in fetchYieldPrediction:", error);
      showToast(error instanceof Error ? error.message : t("Error fetching yield prediction"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrediction = async () => {
    if (!predictionData || !wheatField || !farmerData) {
      showToast(t("No field data available for prediction"));
      return;
    }

    setIsPredicting(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error(t("User not authenticated"));
      }

      const sowingDate = ensureDate(predictionData.sowingDate);
      const { timestamp, days_since_sowing, interval_number } = calculatePredictionParams(sowingDate, predictionData.currentRound);

      // Prepare data for backend request
      const requestData: BackendPredictionRequest = {
        latitude: predictionData.latitude || 0,
        longitude: predictionData.longitude || 0,
        city: ensureCityType(farmerData.city),
        interval_number,
        soil_type: predictionData.soilType || "Unknown",
        sowing_date: formatDate(sowingDate),
        timestamp: formatDate(timestamp),
        days_since_sowing
      };

      // Send request to backend
      const predictedYield = await fetchPredictionFromBackend(requestData);

      // Calculate total yield
      const totalYield = Math.round(predictedYield * predictionData.fieldSize);

      // Get the last prediction for comparison
      const lastPrediction = predictionData.predictionHistory.length > 0
        ? predictionData.predictionHistory[predictionData.predictionHistory.length - 1].predictedYield
        : 0;

      // Determine yield change type
      let yieldChange: "Increased" | "Decreased" | "Stable" | "N/A" = "Stable";
      if (lastPrediction === 0) {
        yieldChange = "N/A";
      } else if (totalYield > lastPrediction) {
        yieldChange = "Increased";
      } else if (totalYield < lastPrediction) {
        yieldChange = "Decreased";
      }

      const newPrediction = {
        round: interval_number,
        date: new Date(),
        predictedYield: totalYield,
        weatherConditions: "Based on satellite data",
        yieldChange: yieldChange,
      };

      const updatedData: YieldPredictionData = {
        ...predictionData,
        currentRound: interval_number,
        predictedYield: totalYield,
        predictionHistory: [...predictionData.predictionHistory, newPrediction],
      };

      // Update the prediction document in Firebase
      const predictionRef = doc(db, "fields", wheatField.id, "predictions", "current");
      await updateDoc(predictionRef, {
        ...updatedData,
        predictionHistory: updatedData.predictionHistory.map(history => ({
          ...history,
          date: Timestamp.fromDate(ensureDate(history.date))
        }))
      });

      setPredictionData(updatedData);
      showToast(t("Prediction updated successfully"), "success");
    } catch (error) {
      console.error("Error updating prediction:", error);
      showToast(error instanceof Error ? error.message : t("Failed to update prediction"));
    } finally {
      setIsPredicting(false);
    }
  };

  if (fieldsLoading || farmerLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A8A41" />
      </View>
    );
  }

  if (!wheatField) {
    return <EmptyState router={router} isRTL={isRTL} t={t} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderSection t={t} isRTL={isRTL} />
        <MapSection wheatField={wheatField} />

        {predictionData && wheatField && (
          <FieldDetailsCard predictionData={predictionData} wheatField={wheatField} isRTL={isRTL} t={t} />
        )}

        {predictionData && <YieldEstimateCard predictionData={predictionData} peracreYield = {peracreYield} isRTL={isRTL} t={t} />}

        {predictionData && <YieldForecastChart predictionData={predictionData} isRTL={isRTL} t={t} />}

        {predictionData && (
          <PredictionControls
            predictionData={predictionData}
            isPredicting={isPredicting}
            handlePrediction={handlePrediction}
            isRTL={isRTL}
            t={t}
          />
        )}

        {predictionData && predictionData.predictionHistory.length > 0 && (
          <PredictionHistory predictionData={predictionData} isRTL={isRTL} t={t} />
        )}
      </ScrollView>
      <Toast visible={toastConfig.visible} message={toastConfig.message} type={toastConfig.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingBottom: 30,
  },
});

export default YieldPredictionComponent;
