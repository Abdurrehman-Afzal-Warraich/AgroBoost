import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Icon } from "react-native-elements";

const LandingPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const options = [
    { 
      title: t("agribot.options.plantDiseases"),
      screen: "farmer/Agribot/PlantDiseases",
      icon: "bug-outline" 
    },
    { 
      title: t("agribot.options.cropAdvice"),
      screen: "farmer/Agribot/CropAdvice",
      icon: "leaf-outline"
    },
    { 
      title: t("agribot.options.fieldManagement"),
      screen: "farmer/Agribot/FieldManagement",
      icon: "grid-outline"
    },
  ];

  const handleHelp = () => {
    router.push("/farmer/Agribot/Help");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require("../../../assets/images/farmer-icons/agribot-logo-1.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>{t("agribot.title")}</Text>

        {/* Description */}
        <Text style={styles.description}>{t("agribot.description")}</Text>

        {/* Options Container */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => router.push(option.screen as any )}
            >
              
              <Text style={styles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Help Button */}
        <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
          <Icon
            name="help-circle-outline"
            type="ionicon"
            color="#2E7D32"
            size={24}
          />
          <Text style={styles.helpText}>{t("agribot.help")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
  },
  content: {
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    backgroundColor: "#333348",
    borderRadius: 75,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: "87%",
    gap: 15,
  },
  optionButton: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    textAlign:"center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 25,
    marginTop: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  helpText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default LandingPage;