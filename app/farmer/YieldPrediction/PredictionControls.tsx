import type React from "react"
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { YieldPredictionData } from "./types"

interface PredictionControlsProps {
  predictionData: YieldPredictionData
  isPredicting: boolean
  handlePrediction: () => void
  isRTL: boolean
  t: (key: string) => string
}

const PredictionControls: React.FC<PredictionControlsProps> = ({
  predictionData,
  isPredicting,
  handlePrediction,
  isRTL,
  t,
}) => {
  return (
    <View style={[styles.predictionCard, styles.cardShadow]}>
      <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="chart-line" size={24} color="#3A8A41" />
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t("Prediction Controls")}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.predictButton, isPredicting && styles.predictButtonDisabled]}
          onPress={handlePrediction}
          disabled={isPredicting}
        >
          {isPredicting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#FFFFFF" />
              <Text style={styles.predictButtonText}>{t("Get Next Prediction")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  predictionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
    marginRight: 0,
  },
  controlsContainer: {
    marginTop: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
  },
  predictButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3A8A41",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  predictButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  predictButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  rtlText: {
    textAlign: "right",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
})

export default PredictionControls

