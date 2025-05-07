"use client"

import { useEffect, useState, useCallback } from "react"
import { StyleSheet, ScrollView, View, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { type FieldData, useFields } from "../../hooks/useFields"
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
import { type YieldPredictionData, CITY_MAPPING } from "./types"

// This function will be replaced with a real API call to the backend
// For now, it simulates a backend response with sample data
const fetchPredictionFromBackend = async (data: {
  city: string
  latitude: number
  longitude: number
  typeOfSoil: string
  sowingDate: Date
  round: number
}): Promise<number> => {
  console.log("Sending prediction request to backend with data:", data)

  // TODO: Replace this with actual API call to backend
  // Example of how the real implementation might look:
  // const response = await fetch('https://your-backend-api.com/predict-yield', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(data),
  // });
  // const result = await response.json();
  // return result.yieldPerAcre;

  // For now, return a simulated response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Use the city mapping directly for yield values
      const cityYield = CITY_MAPPING[data.city] || 30
      const soilFactor = data.typeOfSoil === "Clay" ? 1.1 : data.typeOfSoil === "Loam" ? 1.2 : 0.9
      const roundFactor = 1 + data.round / 20

      // Calculate base yield per acre
      const baseYield = (cityYield * soilFactor * roundFactor) / 10

      // Add some randomness
      const randomFactor = 0.9 + Math.random() * 0.2 // Between 0.9 and 1.1
      const finalYield = Math.round(baseYield * randomFactor)

      resolve(finalYield)
    }, 1500) // Simulate network delay
  })
}

// Calculate days since sowing and current round
const calculateRoundInfo = (sowingDate: Date): { currentRound: number; daysUntilNextRound: number } => {
  const now = new Date()
  const daysSinceSowing = Math.floor((now.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24))

  // First round is 15 days after sowing
  if (daysSinceSowing < 15) {
    return { currentRound: 0, daysUntilNextRound: 15 - daysSinceSowing }
  }

  // Calculate current round (each round is 15 days)
  const currentRound = Math.floor(daysSinceSowing / 15)

  // Calculate days until next round
  const daysUntilNextRound = 15 - (daysSinceSowing % 15)

  return {
    currentRound: Math.min(currentRound, 16), // Cap at 16 rounds
    daysUntilNextRound,
  }
}

const YieldPredictionComponent = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { fields, loading } = useFields()
  const [wheatField, setWheatField] = useState<FieldData | null>(null)
  const [predictionData, setPredictionData] = useState<YieldPredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [userCity, setUserCity] = useState<string | null>(null)
  // For testing: Set to true to bypass the 15-day waiting period
  const [bypassWaitingPeriod, setBypassWaitingPeriod] = useState(true)
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

  // Fetch user's city from Firestore
  const fetchUserCity = useCallback(async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return null

      const userDoc = await getDoc(doc(db, "farmer", user.uid))
      if (userDoc.exists() && userDoc.data().city) {
        setUserCity(userDoc.data().city)
        return userDoc.data().city
      }
      return null
    } catch (error) {
      console.error("Error fetching user city:", error)
      return null
    }
  }, [])

  const initializeData = useCallback(async () => {
    if (dataInitialized) return

    if (!loading && fields && fields.length > 0) {
      console.log("Fields data received:", fields)
      const wheatFieldData = fields.find((field) => field.cropType.toLowerCase() === "wheat")

      if (wheatFieldData) {
        console.log("Found wheat field:", wheatFieldData)
        setWheatField(wheatFieldData)

        // Fetch user's city
        const city = await fetchUserCity()

        // Pass wheatFieldData directly to fetchYieldPrediction
        await fetchYieldPrediction(wheatFieldData.id, city, wheatFieldData)
        setDataInitialized(true)
      } else {
        console.log("No wheat field found in fields data")
        setWheatField(null)
        setIsLoading(false)
        setDataInitialized(true)
      }
    } else if (!loading) {
      // If fields are loaded but empty
      setIsLoading(false)
      setDataInitialized(true)
    }
  }, [fields, loading, dataInitialized, fetchUserCity])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Reset dataInitialized when component unmounts
  useEffect(() => {
    return () => {
      setDataInitialized(false)
    }
  }, [])

  const fetchYieldPrediction = async (fieldId: string, city: string | null, fieldData?: FieldData) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        throw new Error("Please sign in to view predictions")
      }

      if (!fieldId) {
        throw new Error("Field ID is required")
      }

      // Use the passed fieldData or fall back to wheatField state
      const currentFieldData = fieldData || wheatField

      if (!currentFieldData) {
        throw new Error("No wheat field data available")
      }

      // Fetch from fields/{fieldId}/predictions/current
      const predictionRef = doc(db, "fields", fieldId, "predictions", "current")
      const predictionDoc = await getDoc(predictionRef)

      if (predictionDoc.exists()) {
        const data = predictionDoc.data() as YieldPredictionData

        // Calculate current round and days until next round based on sowing date
        const { currentRound, daysUntilNextRound } = calculateRoundInfo(
          data.sowingDate instanceof Timestamp ? data.sowingDate.toDate() : data.sowingDate,
        )

        // Add city average using the CITY_MAPPING
        const cityToUse = data.city || city
        const cityAverage = cityToUse ? CITY_MAPPING[cityToUse] || CITY_MAPPING.Default : null
        const totalCityAverage = cityAverage ? cityAverage * Number(currentFieldData.areaInAcres) : null

        setPredictionData({
          ...data,
          sowingDate: data.sowingDate instanceof Timestamp ? data.sowingDate.toDate() : data.sowingDate,
          cityAverage: cityAverage,
          totalCityAverage: totalCityAverage,
          city: cityToUse,
          soilType: data.soilType || currentFieldData.soilType,
          currentRound: Math.max(data.currentRound, currentRound),
          // For testing: Set daysRemaining to 0 to allow immediate predictions
          daysRemaining: bypassWaitingPeriod ? 0 : daysUntilNextRound,
          predictionHistory: data.predictionHistory.map((history) => ({
            ...history,
            date: history.date instanceof Timestamp ? history.date.toDate() : history.date,
          })),
        })
      } else {
        // Initialize with sample data for new prediction
        // Calculate current round and days until next round based on sowing date
        const { currentRound, daysUntilNextRound } = calculateRoundInfo(currentFieldData.sowingDate)

        // Get city average from CITY_MAPPING
        const cityAverage = city ? CITY_MAPPING[city] || CITY_MAPPING.Default : null
        const totalCityAverage = cityAverage ? cityAverage * Number(currentFieldData.areaInAcres) : null

        // Base prediction on field size and city average with a slight randomization
        const baseYield = totalCityAverage || Number(currentFieldData.areaInAcres) * 38 // Default to 38 if no city average
        const initialPrediction = baseYield + (Math.random() * 10 - 5) // +/- 5 maunds variation

        const sampleData: YieldPredictionData = {
          fieldId: fieldId,
          fieldSize: Number(currentFieldData.areaInAcres),
          cropType: "Wheat",
          sowingDate: currentFieldData.sowingDate,
          latitude: currentFieldData.latitude || 0,
          longitude: currentFieldData.longitude || 0,
          // For testing: Set daysRemaining to 0 to allow immediate predictions
          daysRemaining: bypassWaitingPeriod ? 0 : daysUntilNextRound,
          currentRound: currentRound,
          predictedYield: Math.round(initialPrediction),
          cityAverage: cityAverage,
          totalCityAverage: totalCityAverage,
          city: city,
          soilType: currentFieldData.soilType,
          predictionHistory:
            currentRound > 0
              ? [
                  {
                    round: currentRound,
                    date: new Date(),
                    predictedYield: Math.round(initialPrediction),
                    weatherConditions: "Sunny",
                    yieldChange: "N/A",
                  },
                ]
              : [],
        }

        try {
          await setDoc(predictionRef, {
            ...sampleData,
            sowingDate: Timestamp.fromDate(sampleData.sowingDate),
            predictionHistory: sampleData.predictionHistory.map((history) => ({
              ...history,
              date: Timestamp.fromDate(history.date),
            })),
          })
          setPredictionData(sampleData)
          showToast(t("Initial prediction data created successfully"), "success")
        } catch (error) {
          console.error("Error creating initial prediction:", error)
          throw error
        }
      }
    } catch (error) {
      console.error("Error in fetchYieldPrediction:", error)
      showToast(error instanceof Error ? error.message : t("Error fetching yield prediction"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrediction = async () => {
    if (!predictionData || !wheatField) {
      showToast(t("No field data available for prediction"))
      return
    }

    // Check if days remaining is 0 (skip this check if bypassWaitingPeriod is true)
    if (!bypassWaitingPeriod && predictionData.daysRemaining > 0) {
      showToast(t("Please wait for days to complete before making a new prediction"), "info")
      return
    }

    setIsPredicting(true)
    try {
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        throw new Error(t("User not authenticated"))
      }

      // Get the current round and calculate the next round
      const currentRound = predictionData.currentRound
      const nextRound = currentRound < 16 ? currentRound + 1 : 16 // Cap at 16 rounds

      // Prepare data for backend request
      const requestData = {
        city: predictionData.city || "Default",
        latitude: wheatField.latitude || 0,
        longitude: wheatField.longitude || 0,
        typeOfSoil: predictionData.soilType || wheatField.soilType,
        sowingDate: predictionData.sowingDate instanceof Date ? predictionData.sowingDate : new Date(),
        round: nextRound,
      }

      // Send request to backend (will be replaced with real API call later)
      const yieldPerAcre = await fetchPredictionFromBackend(requestData)

      // Calculate total yield by multiplying with field size
      const totalYield = Math.round(yieldPerAcre * predictionData.fieldSize)

      // Get the last prediction for comparison
      const lastPrediction =
        predictionData.predictionHistory.length > 0
          ? predictionData.predictionHistory[predictionData.predictionHistory.length - 1].predictedYield
          : 0

      // Determine yield change type
      let yieldChange: "Increased" | "Decreased" | "Stable" | "N/A" = "Stable"
      if (lastPrediction === 0) {
        yieldChange = "N/A"
      } else if (totalYield > lastPrediction) {
        yieldChange = "Increased"
      } else if (totalYield < lastPrediction) {
        yieldChange = "Decreased"
      }

      // Determine weather condition (in a real app, this would come from the backend)
      const weatherConditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Drought"]
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]

      const newPrediction = {
        round: nextRound,
        date: new Date(),
        predictedYield: totalYield,
        weatherConditions: randomWeather,
        yieldChange: yieldChange,
      }

      const updatedData = {
        ...predictionData,
        // For testing: Set daysRemaining to 0 to allow immediate predictions again
        daysRemaining: bypassWaitingPeriod ? 0 : 15, // Reset to 15 days in normal operation
        currentRound: nextRound,
        predictedYield: totalYield,
        predictionHistory: [...predictionData.predictionHistory, newPrediction],
      }

      // Update the prediction document
      const predictionRef = doc(db, "fields", wheatField.id, "predictions", "current")
      await updateDoc(predictionRef, {
        ...updatedData,
        predictionHistory: updatedData.predictionHistory.map((history) => ({
          ...history,
          date: history.date instanceof Date ? Timestamp.fromDate(history.date) : history.date,
        })),
      })
      setPredictionData(updatedData)
      showToast(t("Prediction updated successfully"), "success")
    } catch (error) {
      console.error("Error updating prediction:", error)
      showToast(t("Failed to update prediction"))
    } finally {
      setIsPredicting(false)
    }
  }

  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A8A41" />
      </View>
    )
  }

  if (!wheatField) {
    return <EmptyState router={router} isRTL={isRTL} t={t} />
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderSection t={t} isRTL={isRTL} />
        <MapSection wheatField={wheatField} />

        {predictionData && wheatField && (
          <FieldDetailsCard predictionData={predictionData} wheatField={wheatField} isRTL={isRTL} t={t} />
        )}

        {predictionData && <YieldEstimateCard predictionData={predictionData} isRTL={isRTL} t={t} />}

        {predictionData && <YieldForecastChart predictionData={predictionData} isRTL={isRTL} t={t} />}

        {predictionData && (
          <PredictionControls
            predictionData={predictionData}
            isPredicting={isPredicting}
            handlePrediction={handlePrediction}
            isRTL={isRTL}
            t={t}
            bypassWaitingPeriod={bypassWaitingPeriod} // Pass this to control button state
          />
        )}

        {predictionData && predictionData.predictionHistory.length > 0 && (
          <PredictionHistory predictionData={predictionData} isRTL={isRTL} t={t} />
        )}
      </ScrollView>
      <Toast visible={toastConfig.visible} message={toastConfig.message} type={toastConfig.type} onHide={hideToast} />
    </View>
  )
}

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
})

export default YieldPredictionComponent
