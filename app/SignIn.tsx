"use client"

import { useState, useEffect } from "react"
import { StyleSheet, TouchableOpacity, View, Dimensions, Image, Text, Alert } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Input, Button, Icon } from "react-native-elements"
import { useTranslation } from "react-i18next"
import { Toast } from "./components/Toast"
import { db, my_auth } from "@/firebaseConfig"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getDoc, doc } from "firebase/firestore"
import * as SecureStore from "expo-secure-store"
import { CustomToast } from "./components/CustomToast"

const { width } = Dimensions.get("window") // Get screen width

const SignIn = () => {
  const params = useLocalSearchParams<{ userType: string }>()
  const [userType, setUserType] = useState<string | undefined>(params.userType)
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pinCode, setPinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")

  // Update userType when params change
  useEffect(() => {
    if (params.userType) {
      setUserType(params.userType)
    }
  }, [params.userType])

  const isRTL = i18n.language === "ur"

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const validatePhoneNumber = (text: string) => {
    const cleanedText = text.replace(/[\s-]/g, "")

    if (cleanedText.length <= 10 && (!cleanedText.length || cleanedText.startsWith("3"))) {
      setPhoneNumber(cleanedText)
      setErrorMessage("")
    } else if (cleanedText.length > 10) {
      showToast(t("Phone number cannot exceed 10 digits"))
    } else if (!cleanedText.startsWith("3")) {
      showToast(t("Phone number must start with 3"))
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    try {
      if (!email.trim() || !pinCode.trim()) {
        showToast(t("All Fields Required"), "error")
        setLoading(false)
        return
      }

      if (!userType) {
        showToast(t("Please select user type"), "error")
        setLoading(false)
        return
      }

      const response = await signInWithEmailAndPassword(my_auth, email, pinCode)

      // Check if email is verified
      if (!response.user.emailVerified) {
        showToast(t("Please verify your email before signing in"), "info")
        setTimeout(() => {
          router.push("/VerifyEmailScreen")
        }, 1500)
        setLoading(false)
        return
      }

      // Check user document first
      const userDoc = await getDoc(doc(db, userType.toLowerCase(), response.user.uid))

      if (!userDoc.exists()) {
        showToast(t("User document not found"), "error")
        setLoading(false)
        return
      }

      showToast(t("Sign-in successful"), "success")

      // Store auth state
      await SecureStore.setItemAsync("userAuthenticated", "true")
      await SecureStore.setItemAsync("userType", userType)
      await SecureStore.setItemAsync("userEmail", email)


      // Show success toast
      

      // Determine navigation based on user type and new user status
      const isNewUser = userDoc.data().isNewUser
      let navigationTarget = ""

      switch (userType.toLowerCase()) {
        case "farmer":
          navigationTarget = isNewUser ? "/farmer/NewUserForm" : "/farmer/dashboard"
          break
        case "expert":
          navigationTarget = isNewUser ? "/expert/NewExpert" : "/expert/dashboard"
          break
        case "buyer":
          navigationTarget = isNewUser ? "/buyer/NewBuyer" : "/buyer/dashboard"
          break
        default:
          showToast(t("Invalid user type"), "error")
          setLoading(false)
          return
      }

      // Wait longer for success toast to be visible before navigating
      
        router.replace(navigationTarget)
        setLoading(false)
        return

    } catch (error: any) {
      console.error("Error:", error)
      let errMsg = t("An unexpected error occurred")

      if (error.code === "auth/invalid-email") {
        errMsg = t("Invalid email address")
      } else if (error.code === "auth/user-not-found") {
        errMsg = t("User not found")
      } else if (error.code === "auth/wrong-password") {
        errMsg = t("Incorrect password")
      } else if (error.code === "auth/invalid-credential") {
        errMsg = t("Invalid credentials")
      } else {
        errMsg = error.message || t("An unexpected error occurred")
      }

      showToast(errMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = () => {
    if (validateForm()) {
      handleSignIn()
    }
  }

  const validateForm = () => {
    setErrorMessage("") // Reset error message
    if (!email.trim()) {
      setToastVisible(true)
      setToastMessage(t("Email Required"))
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setToastVisible(true)
      setToastMessage(t("Invalid Email Address"))
      return false
    }
    if (pinCode.length !== 6 || !/^\d+$/.test(pinCode)) {
      setToastVisible(true)
      setToastMessage(t("Pin Code Must Be 6 Digits"))
      return false
    }
    return true
  }

  const handleBack = () => {
    router.push("/UserSelectionScreen")
  }

  const handleForgotPin = () => {
    router.push({
      pathname: "/ForgotPin",
      params: { userType },
    })
  }

  // If no userType is available, redirect to user selection
  useEffect(() => {
    if (!userType) {
      console.log("No userType found, redirecting to UserSelectionScreen")
      router.replace("/UserSelectionScreen")
    }
  }, [userType, router])

  if (!userType) {
    return null // Don't render anything while redirecting
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backButton, isRTL && { right: 20, left: "auto" }]} onPress={handleBack}>
        <Icon name={isRTL ? "arrow-forward" : "arrow-back"} type="material" color="#FFC107" size={30} />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image source={require("../assets/app-logo-wo-text.png")} style={styles.logoImage} resizeMode="cover" />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>
          {t("Sign In")} {t("as")} {userType && <Text style={styles.userType}> {t(userType.toLowerCase())}</Text>}
        </Text>
      </View>
      <View style={styles.form}>
        <Input
          placeholder={t("Email")}
          onChangeText={setEmail}
          value={email}
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
          containerStyle={styles.inputField}
          inputContainerStyle={styles.inputContainer}
          inputStyle={[
            styles.inputText,
            isRTL && {
              textAlign: "right",
              paddingRight: 20,
              paddingLeft: 0,
            },
          ]}
          placeholderTextColor="#E0E0E0"
          underlineColorAndroid="transparent"
          textContentType="emailAddress"
          keyboardType={isRTL ? "default" : "email-address"}
        />

        <Input
          placeholder={t("Pin Code")}
          onChangeText={(text) => {
            if (text.length <= 6) {
              setPinCode(text)
            }
          }}
          value={pinCode}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          leftIcon={
            isRTL ? null : (
              <View style={styles.iconContainer}>
                <Icon name="lock" type="material" color="#FFFFFF" />
                <View style={styles.separator} />
              </View>
            )
          }
          rightIcon={
            isRTL ? (
              <View style={styles.iconContainer}>
                <View style={styles.separator} />
                <Icon name="lock" type="material" color="#FFFFFF" />
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
        />
        <TouchableOpacity
          onPress={handleForgotPin}
          style={[styles.forgotPinContainer, isRTL && { alignItems: "flex-start", paddingLeft: 15, paddingRight: 0 }]}
        >
          <Text style={styles.forgotPinText}>{t("Forgot PIN?")}</Text>
        </TouchableOpacity>

        <Button
          title={t("Sign In")}
          onPress={handleFormSubmit}
          loading={loading}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
        />
      </View>
      <TouchableOpacity onPress={() => router.push({ pathname: "/SignUp", params: { userType } })}>
        <Text style={styles.signUpText}>
          {t("Don't Have Account")} <Text style={styles.signUpHighlight}>{t("Create Account")}</Text>
        </Text>
      </TouchableOpacity>
      <Toast 
        visible={toastVisible} 
        message={toastMessage || ""} 
        type={toastType} 
        onHide={() => setToastVisible(false)}
      />
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
  logoContainer: {
    marginTop: -60,
  },

  logoImage: {
    width: 130,
    height: 180,
  },
  titleContainer: {
    marginTop: -30,
    marginBottom: 20,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 30,
  },
  titleMain: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 5,
    lineHeight: 44,
  },
  titleSub: {
    fontSize: 30,
    color: "#FFFFFF",
    paddingVertical: 10,
  },
  userType: {
    color: "#FFC107",
    fontWeight: "bold",
    fontSize: 40,
    marginTop: 5,
    paddingVertical: 15,
    lineHeight: 45,
    paddingHorizontal: 15,
    textAlign: "center",
    minWidth: 150,
    borderRadius: 10,
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    position: "relative",
    borderBottomWidth: 0,
    marginBottom: 15,
    width: "100%",
  },
  inputText: {
    color: "#FFFFFF",
    paddingLeft: 20,
    fontSize: 18,
  },
  inputField: {
    borderBottomWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 53,
    width: "100%",
  },
  buttonContainer: {
    marginTop: 10,
    width: "60%",
    left: "20%",
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
  signUpText: {
    color: "#FFFFFF",
    marginTop: 20,
  },
  signUpHighlight: {
    color: "#FFC107",
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
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
    textAlign: "left",
    marginLeft: 15,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  countryCode: {
    color: "#FFFFFF",
    marginRight: 8,
    fontSize: 16,
  },
  separator: {
    height: 20,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 10,
  },
  forgotPinContainer: {
    alignItems: "flex-end",
    paddingRight: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  forgotPinText: {
    color: "#FFC107",
    fontSize: 14,
    textDecorationLine: "underline",
    textDecorationColor: "#FFC107",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
  labelRTL: {
    textAlign: "right",
    marginRight: 10,
  },
})

export default SignIn
