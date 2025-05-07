import type React from "react"
import { StyleSheet, View, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { YieldPredictionData } from "./types"

interface YieldEstimateCardProps {
  predictionData: YieldPredictionData
  isRTL: boolean
  t: (key: string) => string
}

const YieldEstimateCard: React.FC<YieldEstimateCardProps> = ({ predictionData, isRTL, t }) => {
  return (
    <View style={[styles.predictionCard, styles.cardShadow]}>
      <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="chart-line" size={24} color="#3A8A41" />
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t("Estimated Yield")}</Text>
      </View>
      <View style={styles.yieldContainer}>
        <Text style={styles.yieldValue}>
          {predictionData.predictedYield} {t("maunds")}
        </Text>

        {predictionData.cityAverage && predictionData.totalCityAverage && (
          <View style={[styles.yieldComparisonContainer, isRTL && styles.rtlRow]}>
            {predictionData.predictedYield > predictionData.totalCityAverage ? (
              <MaterialCommunityIcons name="arrow-up" size={24} color="#3A8A41" />
            ) : (
              <MaterialCommunityIcons name="arrow-down" size={24} color="#E74C3C" />
            )}
            <Text
              style={[
                styles.yieldComparison,
                isRTL && styles.rtlText,
                {
                  color: predictionData.predictedYield > predictionData.totalCityAverage ? "#3A8A41" : "#E74C3C",
                },
              ]}
            >
              {Math.abs(Math.round((predictionData.predictedYield / predictionData.totalCityAverage - 1) * 100))}%{" "}
              {predictionData.predictedYield > predictionData.totalCityAverage
                ? t("higher than city average")
                : t("lower than city average")}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.yieldMetricsContainer}>
          {predictionData.cityAverage && (
            <View style={styles.yieldMetric}>
              <Text style={[styles.metricLabel, isRTL && styles.rtlText]}>{t("City Average (per acre)")}</Text>
              <Text style={[styles.metricValue, isRTL && styles.rtlText, styles.cityAverageValue]}>
                {predictionData.cityAverage} {t("maunds")}
              </Text>
            </View>
          )}

          {predictionData.totalCityAverage && (
            <View style={styles.yieldMetric}>
              <Text style={[styles.metricLabel, isRTL && styles.rtlText]}>{t("Total City Average")}</Text>
              <Text style={[styles.metricValue, isRTL && styles.rtlText, styles.cityAverageValue]}>
                {predictionData.totalCityAverage} {t("maunds")}
              </Text>
            </View>
          )}

          <View style={styles.yieldMetric}>
            <Text style={[styles.metricLabel, isRTL && styles.rtlText]}>{t("Total Field Size")}</Text>
            <Text style={[styles.metricValue, isRTL && styles.rtlText]}>
              {predictionData.fieldSize} {t("acres")}
            </Text>
          </View>
        </View>
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
  yieldContainer: {
    paddingVertical: 12,
  },
  yieldValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#3A8A41",
    textAlign: "center",
    marginBottom: 8,
  },
  yieldComparisonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  yieldComparison: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
    marginRight: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 12,
  },
  yieldMetricsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  yieldMetric: {
    alignItems: "center",
    marginHorizontal: 5,
    marginVertical: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  cityAverageValue: {
    color: "#1E88E5", // More prominent blue color for city average
    fontWeight: "700",
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

export default YieldEstimateCard
