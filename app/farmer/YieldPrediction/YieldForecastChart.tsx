import type React from "react"
import { StyleSheet, View, Text, ScrollView, Dimensions } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { type YieldPredictionData, ROUND_TO_MONTH_MAPPING } from "./types"

interface YieldForecastChartProps {
  predictionData: YieldPredictionData
  isRTL: boolean
  t: (key: string) => string
}

const YieldForecastChart: React.FC<YieldForecastChartProps> = ({ predictionData, isRTL, t }) => {
  // Create an array of all months from Sep to Apr
  const allMonths = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]

  // Create data points for all months
  const createDataPoints = () => {
    // Initialize an array with null values for all months (8 months, 2 points per month = 16 points)
    const dataPoints = Array(16).fill(null)

    // Fill in actual prediction data where available
    predictionData.predictionHistory.forEach((prediction) => {
      if (prediction.round >= 1 && prediction.round <= 16) {
        dataPoints[prediction.round - 1] = prediction.predictedYield
      }
    })

    return dataPoints
  }

  // Create labels for all months (with round numbers where predictions exist)
  const createLabels = () => {
    return ROUND_TO_MONTH_MAPPING.map((item, index) => {
      const hasPrediction = predictionData.predictionHistory.some((p) => p.round === index + 1)
      return `${item.month}\n${hasPrediction ? `R${index + 1}` : ""}`
    })
  }

  // Get data points and labels
  const dataPoints = createDataPoints()
  const labels = createLabels()

  // Create city average line if available
  const cityAverageLine = predictionData.totalCityAverage ? Array(16).fill(predictionData.totalCityAverage) : []

  return (
    <View style={[styles.graphCard, styles.cardShadow]}>
      <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="chart-areaspline" size={24} color="#3A8A41" />
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t("Yield Forecast Trend")}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: labels,
            datasets: [
              {
                data: dataPoints,
                color: (opacity = 1) => `rgba(58, 138, 65, ${opacity})`,
                strokeWidth: 2,
                withDots: true,
              },
              ...(predictionData.totalCityAverage
                ? [
                    {
                      data: cityAverageLine,
                      color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`, // Brighter blue for city average
                      strokeWidth: 3, // Thicker line for city average
                      withDots: false,
                    },
                  ]
                : []),
            ],
            legend: predictionData.totalCityAverage ? ["Predicted Yield", "City Average"] : ["Predicted Yield"],
          }}
          width={Math.max(Dimensions.get("window").width - 40, 16 * 60)} // Ensure enough width for all 16 points
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#3A8A41",
            },
            propsForLabels: {
              fontSize: 9,
              rotation: 0,
            },
            // Handle null values in the dataset
            fillShadowGradientOpacity: 0,
            useShadowColorFromDataset: false,
          }}
          bezier
          style={styles.chart}
          fromZero
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withShadow={false}
          withDots={true}
          withScrollableDot={false}
          verticalLabelRotation={0}
          horizontalLabelRotation={0}
          xLabelsOffset={0}
          yLabelsOffset={8}
          segments={5}
        />
      </ScrollView>
      <View style={[styles.legendContainer, isRTL && styles.rtlRow]}>
        <View style={[styles.legendItem, isRTL && styles.rtlRow]}>
          <View style={[styles.legendColor, { backgroundColor: "#3A8A41" }]} />
          <Text style={[styles.legendText, isRTL && styles.rtlText]}>{t("Predicted Yield")}</Text>
        </View>
        {predictionData.totalCityAverage && (
          <View style={[styles.legendItem, isRTL && styles.rtlRow]}>
            <View style={[styles.legendColor, { backgroundColor: "#1E88E5" }]} />
            <Text style={[styles.legendText, isRTL && styles.rtlText]}>{t("City Average")}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t("First round starts 15 days after sowing")}</Text>
        <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t("Each round represents 15 days")}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  graphCard: {
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
  chart: {
    marginVertical: 12,
    borderRadius: 12,
    paddingRight: 20, // Add padding to prevent overflow
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    marginLeft: 0,
  },
  legendText: {
    fontSize: 12,
    color: "#666666",
  },
  infoContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginBottom: 4,
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

export default YieldForecastChart
