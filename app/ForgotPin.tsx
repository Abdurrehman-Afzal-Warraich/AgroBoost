"use client"

import { useState } from "react"
import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Input, Button, Icon } from "react-native-elements"
import { useTranslation } from "react-i18next"
import { sendPasswordResetEmail } from "firebase/auth"
import { my_auth } from "../firebaseConfig"
import { Toast } from "./components/Toast"

const ForgotPin = () => {
  const router = useRouter()
  const { userType } = useLocalSearchParams<{ userType: string }>()
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { t, i18n } = useTranslation()
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")

  const isRTL = i18n.language === "ur"

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const validateEmail = (text: string) => {
    setEmail(text)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(text.trim())) {
      setErrorMessage(t("Invalid email format"))
    } else {
      setErrorMessage("")
    }
  }

  const handleResetPassword = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast(t("Please enter a valid email address"), "error")
      return
    }

    setLoading(true)
    try {
      console.log("Attempting to send password reset email to:", email)

      // Actually send the password reset email using Firebase
      await sendPasswordResetEmail(my_auth, email)
      console.log("Password reset email sent successfully")

      // Show success toast and navigate
      showToast(t("Reset email sent successfully"), "success")

      // Navigate after a short delay to allow the toast to be seen
      setTimeout(() => {
        router.push({
          pathname: "/ResetPasswordConfirmation",
          params: { email, userType },
        })
      }, 1500)
    } catch (error: any) {
      console.error("Error sending reset email:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      let errorMsg = t("Failed to send reset email")

      if (error.code === "auth/user-not-found") {
        errorMsg = t("No account found with this email")
      } else if (error.code === "auth/invalid-email") {
        errorMsg = t("Invalid email format")
      } else if (error.code === "auth/too-many-requests") {
        errorMsg = t("Too many requests. Please try again later")
      } else if (error.code === "auth/network-request-failed") {
        errorMsg = t("Network error. Please check your internet connection")
      }

      showToast(errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push({
      pathname: "/SignIn",
      params: { userType },
    })
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backButton, isRTL && { right: 20, left: "auto" }]} onPress={handleBack}>
        <Icon name={isRTL ? "arrow-forward" : "arrow-back"} type="material" color="#FFC107" size={30} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>{t("Forgot PIN")}</Text>
        <Text style={styles.titleSub}>{t("Enter your registered email address")}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Input
            placeholder={t("Enter your email")}
            onChangeText={validateEmail}
            value={email}
            keyboardType="email-address"
            leftIcon={
              isRTL ? null : (
                <View style={styles.iconContainer}>
                  <Icon name="email" type="material" color="#FFFFFF" />
                  <View style={styles.separator} />
                </View>
              )
            }
            rightIcon={
              isRTL ? (
                <View style={styles.iconContainer}>
                  <View style={styles.separator} />
                  <Icon name="email" type="material" color="#FFFFFF" />
                </View>
              ) : null
            }
            inputStyle={[
              styles.inputText,
              isRTL && {
                textAlign: "right",
                paddingRight: 20,
                paddingLeft: 0,
              },
            ]}
            placeholderTextColor="#E0E0E0"
            containerStyle={styles.inputField}
            underlineColorAndroid="transparent"
            inputContainerStyle={{ borderBottomWidth: 0 }}
            errorMessage={errorMessage}
            errorStyle={[styles.errorText, isRTL && { textAlign: "right" }]}
            disabled={loading}
          />
        </View>

        <Button
          title={loading ? t("Sending...") : t("Reset Password")}
          onPress={handleResetPassword}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#1B5E20" size="small" style={{ marginRight: 10 }} /> : null}
        />
      </View>

      <Text style={[styles.infoText, isRTL && { textAlign: "right" }]}>
        {t("We'll send you an email with instructions to reset your password.")}
      </Text>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#4CAF50",
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 30,
  },
  titleMain: {
    fontSize: 30,
    color: "#FFC107",
    fontWeight: "bold",
    marginBottom: 10,
    lineHeight: 42,
  },
  titleSub: {
    fontSize: 20,
    color: "#FFFFFF",
    marginTop: 10,
    textAlign: "center",
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 15,
    width: "100%",
  },
  inputText: {
    color: "#FFFFFF",
    paddingLeft: 20,
    fontSize: 16,
  },
  inputField: {
    borderBottomWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 50,
    width: "100%",
  },
  buttonContainer: {
    marginTop: 20,
    width: "80%",
    left: "10%",
  },
  button: {
    backgroundColor: "#FFC107",
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonTitle: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 20,
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
  errorText: {
    color: "#FF6B6B",
    marginTop: 5,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  separator: {
    height: 20,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 10,
  },
  infoText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    paddingHorizontal: 20,
  },
})

export default ForgotPin
