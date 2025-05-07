import type React from "react"
import { StyleSheet, View, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { YieldPredictionData } from "./types"

interface PredictionHistoryProps {
  predictionData: YieldPredictionData
  isRTL: boolean
  t: (key: string) => string
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ predictionData, isRTL, t }) => {
  return (
    <View style={[styles.historyCard, styles.cardShadow]}>
      <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="history" size={24} color="#3A8A41" />
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t("Prediction History")}</Text>
      </View>
      <View style={[styles.historyHeaderRow, isRTL && styles.rtlRow]}>
        <Text style={[styles.historyHeaderDate, isRTL && styles.rtlText]}>{t("Date")}</Text>
        <Text style={[styles.historyHeaderYield, isRTL && styles.rtlText]}>{t("Yield (maunds)")}</Text>
        <Text style={[styles.historyHeaderTrend, isRTL && styles.rtlText]}>{t("Trend")}</Text>
      </View>
      {predictionData.predictionHistory
        .slice()
        .reverse()
        .map((prediction, index) => (
          <View key={index} style={[styles.historyItem, isRTL && styles.rtlRow]}>
            <Text style={[styles.historyDate, isRTL && styles.rtlText]}>
              {prediction.date instanceof Date ? prediction.date.toLocaleDateString() : new Date().toLocaleDateString()}
            </Text>
            <Text style={[styles.historyYield, isRTL && styles.rtlText]}>{prediction.predictedYield}</Text>
            <View
              style={[styles.trendContainer, isRTL && { flexDirection: "row-reverse", justifyContent: "flex-start" }]}
            >
              {prediction.yieldChange !== "N/A" && (
                <MaterialCommunityIcons
                  name={
                    prediction.yieldChange === "Increased"
                      ? "trending-up"
                      : prediction.yieldChange === "Decreased"
                        ? "trending-down"
                        : "trending-neutral"
                  }
                  size={18}
                  color={
                    prediction.yieldChange === "Increased"
                      ? "#3A8A41"
                      : prediction.yieldChange === "Decreased"
                        ? "#E74C3C"
                        : "#F39C12"
                  }
                  style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
                />
              )}
              <Text
                style={[
                  styles.historyTrend,
                  isRTL && styles.rtlText,
                  {
                    color:
                      prediction.yieldChange === "Increased"
                        ? "#3A8A41"
                        : prediction.yieldChange === "Decreased"
                          ? "#E74C3C"
                          : prediction.yieldChange === "Stable"
                            ? "#F39C12"
                            : "#666666",
                  },
                ]}
              >
                {t(prediction.yieldChange)}
              </Text>
            </View>
          </View>
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  historyCard: {
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
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    marginBottom: 4,
  },
  historyHeaderDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  historyHeaderYield: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
  },
  historyHeaderTrend: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textAlign: "right",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  historyDate: {
    flex: 1,
    fontSize: 14,
    color: "#666666",
  },
  historyYield: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    textAlign: "center",
  },
  trendContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  historyTrend: {
    fontSize: 14,
    textAlign: "right",
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

export default PredictionHistory
