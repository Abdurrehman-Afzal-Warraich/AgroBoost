import type React from "react"
import { StyleSheet, View, Text, ActivityIndicator } from "react-native"
import { Button } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { YieldPredictionData } from "./types"

interface PredictionControlsProps {
  predictionData: YieldPredictionData
  isPredicting: boolean
  handlePrediction: () => Promise<void>
  isRTL: boolean
  t: (key: string) => string
  bypassWaitingPeriod?: boolean // Add this prop to control button state
}

const PredictionControls: React.FC<PredictionControlsProps> = ({
  predictionData,
  isPredicting,
  handlePrediction,
  isRTL,
  t,
  bypassWaitingPeriod = false, // Default to false
}) => {
  // Determine if the button should be disabled
  const isButtonDisabled = isPredicting || (!bypassWaitingPeriod && predictionData.daysRemaining > 0)

  return (
    <View style={[styles.daysCard, styles.cardShadow]}>
      <View style={[styles.daysRemaining, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="calendar-clock" size={24} color="#3A8A41" />
        <Text style={[styles.daysText, isRTL && styles.rtlText]}>
          {t("Days Until Next Prediction")}: {predictionData.daysRemaining}
          {bypassWaitingPeriod && <Text style={styles.testModeText}> ({t("Test Mode: Waiting Period Bypassed")})</Text>}
        </Text>
      </View>
      <Button
        title={
          isPredicting
            ? t("Predicting...")
            : !bypassWaitingPeriod && predictionData.daysRemaining > 0
              ? t("Wait for days to complete")
              : t("Update Prediction")
        }
        onPress={handlePrediction}
        buttonStyle={[styles.predictButton, isButtonDisabled && !bypassWaitingPeriod && styles.disabledButton]}
        titleStyle={[styles.buttonTitle, isRTL && styles.rtlText]}
        containerStyle={styles.predictButtonContainer}
        icon={
          isPredicting ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
              style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
            />
          ) : isRTL ? null : (
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          )
        }
        iconRight={isRTL}
        iconPosition={isRTL ? "right" : "left"}
        disabled={isButtonDisabled && !bypassWaitingPeriod}
        loading={isPredicting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  daysCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  daysRemaining: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  daysText: {
    fontSize: 18,
    color: "#333333",
    fontWeight: "500",
    marginLeft: 8,
    marginRight: 0,
  },
  testModeText: {
    fontSize: 14,
    color: "#FF9800",
    fontStyle: "italic",
  },
  predictButton: {
    backgroundColor: "#3A8A41",
    borderRadius: 8,
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  predictButtonContainer: {
    marginTop: 8,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
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
