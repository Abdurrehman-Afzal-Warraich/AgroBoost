import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../i18n"; // Import the i18n configuration
import { Icon } from "react-native-elements";
import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LandingPage from "./farmer/Agribot/LandingPage";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useNavigation } from "@react-navigation/native";

import { color } from "react-native-elements/dist/helpers";
import CustomHeader from "../app/components/CustomHeader";
import { UserProvider } from "./context/UserProvider";
import * as SecureStore from "expo-secure-store";
import { AuthProvider } from "./context/AuthContext";
// import YieldPrediction from './farmer/YieldPrediction/YieldPrediction';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const router = useRouter();
  const { t } = useTranslation();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      setIsLayoutReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!isLayoutReady) {
    return null;
  }

  const commonHeaderOptions = {
    headerStyle: { backgroundColor: "#61B15A" },
    headerTintColor: "#FFFFFF",
    headerTitleStyle: { fontWeight: "bold" as const },
  };

  return (
    <UserProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="SplashScreen"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LanguageSelection"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="UserSelectionScreen"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="SignIn" options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPin" options={{ headerShown: false }} />
            <Stack.Screen name="VerifyPin" options={{ headerShown: false }} />
            <Stack.Screen
              name="VerifyEmailScreen"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPasswordConfirmation"
              options={{ headerShown: false }}
            />
            {/* Farmer Screens */}
            <Stack.Screen
              name="farmer/dashboard"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="farmer/NewUserForm"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="farmer/Profile"
              options={{ ...commonHeaderOptions, title: t("Profile") }}
            />
            <Stack.Screen
              name="farmer/Settings"
              options={{ ...commonHeaderOptions, title: t("Settings") }}
            />
            <Stack.Screen
              name="farmer/Help"
              options={{ ...commonHeaderOptions, title: t("Help") }}
            />
            <Stack.Screen
              name="farmer/CoinScreen"
              options={{ ...commonHeaderOptions, title: t("Coins") }}
            />
            <Stack.Screen
              name="farmer/YieldPrediction"
              options={{ ...commonHeaderOptions, title: t("Yield Prediction") }}
            />
            <Stack.Screen
              name="farmer/ChatScreen"
              options={{ ...commonHeaderOptions, title: t("Chat") }}
            />
            <Stack.Screen
              name="farmer/ExpertConsultation"
              options={{
                ...commonHeaderOptions,
                title: t("expertConsultation"),
              }}
            />
            <Stack.Screen
              name="farmer/BuyCoins"
              options={{ ...commonHeaderOptions, title: t("buyCoins") }}
            />
            <Stack.Screen
              name="farmer/AuctionSystem"
              options={{ ...commonHeaderOptions, title: t("AuctionSystem") }}
            />
            <Stack.Screen
              name="farmer/AuctionPreview"
              options={{ ...commonHeaderOptions, title: t("Auction Preview") }}
            />
            <Stack.Screen
              name="farmer/MyAuctions"
              options={{ ...commonHeaderOptions, title: t("My Auctions") }}
            />
            <Stack.Screen
              name="farmer/FieldDetails"
              options={{ ...commonHeaderOptions, title: t("Field Details") }}
            />
            <Stack.Screen
              name="farmer/SchemesList"
              options={{
                ...commonHeaderOptions,
                title: t("agricultureSchemes"),
              }}
            />
            <Stack.Screen
              name="farmer/SchemeDetails"
              options={{ ...commonHeaderOptions, title: t("schemeDetails") }}
            />
            <Stack.Screen
              name="farmer/Agribot/LandingPage"
              options={{ ...commonHeaderOptions, title: t("AgriBot") }}
            />
            <Stack.Screen
              name="farmer/Agribot/PlantDiseases"
              options={{
                ...commonHeaderOptions,
                title: t("agribot.plantDiseases.title"),
              }}
            />
            <Stack.Screen
              name="farmer/Agribot/CropAdvice"
              options={{
                ...commonHeaderOptions,
                title: t("agribot.cropAdvice.title"),
              }}
            />
            <Stack.Screen
              name="farmer/Agribot/FieldManagement"
              options={{
                ...commonHeaderOptions,
                title: t("agribot.fieldManagement.title"),
              }}
            />

            <Stack.Screen
              name="farmer/Agribot/Help"
              options={{
                ...commonHeaderOptions,
                title: t("agribot.help.title"),
              }}
            />

            {/* Expert Screens */}
            <Stack.Screen
              name="expert/dashboard"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="expert/NewExpert"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="expert/Profile"
              options={{ ...commonHeaderOptions, title: t("Profile") }}
            />
            <Stack.Screen
              name="expert/Settings"
              options={{ ...commonHeaderOptions, title: t("Settings") }}
            />
            <Stack.Screen
              name="expert/Help"
              options={{ ...commonHeaderOptions, title: t("Help") }}
            />
            <Stack.Screen
              name="expert/CoinScreen"
              options={{ ...commonHeaderOptions, title: t("Coins") }}
            />
            <Stack.Screen
              name="expert/MessagesTab"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="expert/ChatScreen"
              options={{ ...commonHeaderOptions, title: t("Chat") }}
            />
            {/* Buyer Screens */}
            <Stack.Screen
              name="buyer/dashboard"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="buyer/NewBuyer"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="buyer/Profile"
              options={{ ...commonHeaderOptions, title: t("Profile") }}
            />
            <Stack.Screen
              name="buyer/Settings"
              options={{ ...commonHeaderOptions, title: t("Settings") }}
            />
            <Stack.Screen
              name="buyer/Help"
              options={{ ...commonHeaderOptions, title: t("Help") }}
            />
            <Stack.Screen
              name="buyer/CoinScreen"
              options={{ ...commonHeaderOptions, title: t("Coins") }}
            />
            <Stack.Screen
              name="buyer/AuctionSystemTab"
              options={{ headerShown: false }}
            />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </UserProvider>
  );
}
