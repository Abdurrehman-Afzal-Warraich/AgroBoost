import React from "react"
import { StyleSheet, View, Text } from "react-native"
import { Button } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Router } from "expo-router"

interface EmptyStateProps {
  router: Router
  isRTL: boolean
  t: (key: string) => string
}

const EmptyState: React.FC<EmptyStateProps> = ({ router, isRTL, t }) => {
  return (
    <View style={styles.container}>
      <View style={styles.emptyStateContainer}>
        <MaterialCommunityIcons name="sprout" size={80} color="#DEA82A" />
        <Text style={styles.emptyStateTitle}>{t("No Wheat Fields Found")}</Text>
        <Text style={styles.emptyStateText}>{t("Please add wheat field details to make yield predictions")}</Text>
        <Button
          title={t("Add Wheat Field")}
          onPress={() => router.push("/farmer/FieldDetails")}
          buttonStyle={styles.addFieldButton}
          titleStyle={styles.addFieldButtonTitle}
          containerStyle={styles.addFieldButtonContainer}
          icon={
            isRTL ? null : <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          }
          iconRight={isRTL}
          iconPosition={isRTL ? "right" : "left"}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  addFieldButton: {
    backgroundColor: "#3A8A41",
    borderRadius: 8,
    paddingHorizontal: 20,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  addFieldButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  addFieldButtonContainer: {
    width: "80%",
    marginTop: 16,
  },
})

export default EmptyState
