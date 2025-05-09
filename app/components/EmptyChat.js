import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

const EmptyChat = ({ userType }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#CCCCCC" />
      <Text style={styles.title}>No messages yet</Text>
      <Text style={styles.subtitle}>
        {userType === "farmer"
          ? "Start a conversation with the expert to get agricultural advice."
          : "Start a conversation with the farmer to provide agricultural advice."}
      </Text>
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={20} color="#4CAF50" />
        <Text style={styles.tipText}>
          {userType === "farmer"
            ? "Tip: Share details about your crops, soil conditions, or specific issues you're facing."
            : "Tip: Ask questions to better understand the farmer's situation before providing advice."}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 80, // Add padding at the bottom to ensure content doesn't overlap with input field
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  tipContainer: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  tipText: {
    fontSize: 14,
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
  },
})

export default EmptyChat
