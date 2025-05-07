import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Image } from "react-native"
import { useRouter } from "expo-router"
import { Button, Icon } from "react-native-elements"
import { useTranslation } from "react-i18next"
import { sendEmailVerification, signOut, reload } from "firebase/auth"
import { my_auth  } from "../firebaseConfig"
import { getAuth } from 'firebase/auth';


const VerifyEmailScreen = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const { t } = useTranslation()
  const auth = getAuth();
        

  const handleCheckVerification = async () => {
    setLoading(true)
    try {

      await reload(auth.currentUser)
      if (auth.currentUser?.emailVerified) {
        Alert.alert(t("Success"), t("Your email has been verified successfully."), [
          {
            text: "OK",
            onPress: () => {
              router.replace("/SignIn")
            },
          },
        ])
      } else {
        Alert.alert(
          t("Not Verified"),
          t("Your email is not verified yet. Please check your inbox and verify your email."),
        )
      }
    } catch (error) {
      Alert.alert(t("Error"), t("Failed to check verification status"))
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await sendEmailVerification(auth.currentUser)
      Alert.alert(t("Success"), t("Verification email has been resent. Please check your inbox."))
    } catch (error) {
      Alert.alert(t("Error"), t("Failed to resend verification email"))
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(my_auth)
      router.replace("/SignIn")
    } catch (error) {
      Alert.alert(t("Error"), t("Failed to sign out"))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleSignOut}>
        <Icon name="arrow-back" type="material" color="#FFC107" size={30} />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image source={require("../assets/app-logo-wo-text.png")} style={styles.logoImage} resizeMode="cover" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("Verify Your Email")}</Text>
        <Text style={styles.message}>{t("We've sent a verification email to:")}</Text>
        <Text style={styles.email}>{my_auth.currentUser?.email}</Text>
        <Text style={styles.instructions}>
          {t("Please check your inbox and click the verification link to activate your account.")}
        </Text>

        <Button
          title={t("I've Verified My Email")}
          onPress={handleCheckVerification}
          loading={loading}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
        />

        <Button
          title={t("Resend Verification Email")}
          onPress={handleResendVerification}
          loading={resendLoading}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.secondaryButton}
          titleStyle={styles.secondaryButtonText}
        />

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>{t("Sign Out")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  logoImage: {
    width: 130,
    height: 180,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFC107",
    marginBottom: 20,
    textAlign: "center",
  },
  instructions: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 10,
    width: "80%",
  },
  button: {
    backgroundColor: "#FFC107",
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  buttonTitle: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  secondaryButtonText: {
    color: "#FFC107",
    fontWeight: "bold",
    fontSize: 18,
  },
  signOutButton: {
    marginTop: 30,
  },
  signOutButtonText: {
    color: "#FFC107",
    fontSize: 16,
    textDecorationLine: "underline",
  },
})

export default VerifyEmailScreen
