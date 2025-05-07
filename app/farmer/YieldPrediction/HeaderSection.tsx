import type React from "react"
import { StyleSheet, View, Text } from "react-native"

interface HeaderSectionProps {
  t: (key: string) => string
  isRTL: boolean
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ t, isRTL }) => {
  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t("Wheat Yield Prediction")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
  },
  rtlText: {
    textAlign: "right",
  },
})

export default HeaderSection
