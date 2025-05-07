import type React from "react"
import { StyleSheet, View, Text } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { YieldPredictionData } from "./types"
import type { FieldData } from "../../hooks/useFields"

interface FieldDetailsCardProps {
  predictionData: YieldPredictionData
  wheatField: FieldData
  isRTL: boolean
  t: (key: string) => string
}

const FieldDetailsCard: React.FC<FieldDetailsCardProps> = ({ predictionData, wheatField, isRTL, t }) => {
  return (
    <View style={[styles.predictionCard, styles.cardShadow]}>
      <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
        <MaterialCommunityIcons name="sprout" size={24} color="#DEA82A" />
        <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t("Field Details")}</Text>
      </View>
      <View style={styles.fieldDetailsContainer}>
        <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
          <MaterialCommunityIcons name="ruler" size={20} color="#666" />
          <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("Area")}:</Text>
          <Text style={[styles.detailValue, isRTL && styles.rtlText]}>
            {wheatField.areaInAcres} {t("acres")}
          </Text>
        </View>

        <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
          <MaterialCommunityIcons name="sprout" size={20} color="#666" />
          <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("Crop Type")}:</Text>
          <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{t(wheatField.cropType)}</Text>
        </View>

        <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
          <MaterialCommunityIcons name="water" size={20} color="#666" />
          <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("Soil Type")}:</Text>
          <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{t(wheatField.soilType)}</Text>
        </View>

        <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
          <MaterialCommunityIcons name="calendar" size={20} color="#666" />
          <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("Sowing Date")}:</Text>
          <Text style={[styles.detailValue, isRTL && styles.rtlText]}>
            {wheatField.sowingDate.toLocaleDateString()}
          </Text>
        </View>

        {predictionData.city && (
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <MaterialCommunityIcons name="city" size={20} color="#666" />
            <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("City")}:</Text>
            <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{t(predictionData.city)}</Text>
          </View>
        )}

        {wheatField.latitude && wheatField.longitude && (
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
            <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t("Location")}:</Text>
            <Text style={[styles.detailValue, isRTL && styles.rtlText]}>
              {wheatField.latitude.toFixed(4)}, {wheatField.longitude.toFixed(4)}
            </Text>
          </View>
        )}
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
  fieldDetailsContainer: {
    marginTop: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    marginLeft: 8,
    marginRight: 0,
    fontSize: 14,
    color: "#666666",
    width: 100,
    fontWeight: "500",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    marginLeft: 8,
    marginRight: 0,
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

export default FieldDetailsCard
