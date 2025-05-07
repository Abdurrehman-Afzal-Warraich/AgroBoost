"use client"

import { useState } from "react"
import { StyleSheet, TouchableOpacity, View, Dimensions, Image, Alert, Text } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Input, Button, Icon } from "react-native-elements"
import { useTranslation } from "react-i18next"
import { Toast } from "./components/Toast"

import { my_auth, db } from "@/firebaseConfig"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

const { width } = Dimensions.get("window") // Get screen width

const SignUp = () => {
  const { userType } = useLocalSearchParams<{ userType: string }>()
  const router = useRouter()
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pinCode, setPinCode] = useState("")
  const [confirmPinCode, setConfirmPinCode] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const { t, i18n } = useTranslation()
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [loading, setLoading] = useState(false) // Loading state
  const [email, setEmail] = useState("")

  const isRTL = i18n.language === "ur"

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const validateForm = () => {
    setErrorMessage("") // Reset error message
    if (!name.trim()) {
      showToast(t("Name Required"))
      return false
    }
    if (!email.trim()) {
      showToast(t("Email Required"))
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showToast(t("Invalid Email"))
      return false
    }
    if (pinCode.length !== 6 || !/^\d+$/.test(pinCode.trim())) {
      showToast(t("Pin Code Must Be 6 Digits"))
      return false
    }
    if (pinCode !== confirmPinCode) {
      showToast(t("Pins Must Match"))
      return false
    }
    return true
  }

  const handleSignUp = async () => {
    setLoading(true)
    if (validateForm()) {
      try {
        const userCredential = await createUserWithEmailAndPassword(my_auth, email, pinCode)

        // Add this line to send email verification
        await sendEmailVerification(userCredential.user)

        const userRef = doc(db, "users", userCredential.user.uid)

        // Ensure userType is not undefined or null before saving it to Firestore
        const userData = {
          name,
          email,
          userType: userType || "", // Ensure userType is defined
          createdAt: new Date(),
        }

        await setDoc(userRef, userData)

        if (userType) {
          const userTypeRef = doc(db, userType.toLowerCase(), userCredential.user.uid)
          await setDoc(userTypeRef, {
            name,
            email,
            isNewUser: true,
            createdAt: new Date(),
          })
        }

        Alert.alert(
          t("Success"),
          t("Account Created Successfully. Please check your email to verify your account before signing in."),
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form data
                setName("")
                setEmail("")
                setPinCode("")
                setConfirmPinCode("")
                // Navigate to SignIn with the same userType
                router.replace({
                  pathname: "/SignIn",
                  params: { userType },
                })
              },
            },
          ],
        )
      } catch (error: any) {
        console.error("Error creating user:", error)
        let errMsg = t("An unexpected error occurred")
        if (error.code === "auth/email-already-in-use") {
          errMsg = t("Email already in use")
        } else if (error.code === "auth/invalid-email") {
          errMsg = t("Invalid email address")
        } else if (error.code === "auth/weak-password") {
          errMsg = t("Weak password, please choose a stronger password")
        } else {
          errMsg = error.message || t("An unexpected error occurred")
        }
        showToast(errMsg)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push({ pathname: "/SignIn", params: { userType } })
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
          {t("Sign Up")} {t("as")} {userType && <Text style={styles.userType}> {t(userType.toLowerCase())}</Text>}
        </Text>
      </View>
      <View style={styles.form}>
        <Input
          placeholder={t("Name")}
          onChangeText={setName}
          value={name}
          leftIcon={
            isRTL ? null : (
              <View style={styles.iconContainer}>
                <Icon name="person" type="material" color="#FFFFFF" />
                <View style={styles.separator} />
              </View>
            )
          }
          rightIcon={
            isRTL ? (
              <View style={styles.iconContainer}>
                <View style={styles.separator} />
                <Icon name="person" type="material" color="#FFFFFF" />
              </View>
            ) : null
          }
          containerStyle={styles.inputWrapper}
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
        />
        {/* 
          Uncomment and update phone number input if needed
          <Text style={[styles.label, isRTL && styles.labelRTL]}>{t('Phone Number')}</Text>
          <Input
            placeholder="3XXXXXXXXX"
            onChangeText={validatePhoneNumber}
            value={phoneNumber}
            keyboardType="numeric"
            leftIcon={
              <View style={[styles.iconContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                <Image source={require('../assets/pakistan-flag.jpg')} style={styles.flagIcon} />
                <Text style={styles.countryCode}>+92</Text>
                <View style={styles.separator} />
              </View>
            }
            containerStyle={styles.inputWrapper}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            placeholderTextColor="#E0E0E0"
            errorMessage={errorMessage}
            errorStyle={styles.errorText}
          />
        */}
        <Input
          placeholder={t("Enter Email")}
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
          containerStyle={styles.inputWrapper}
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
          placeholder={t("Enter Pin Code")}
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
          containerStyle={styles.inputWrapper}
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
        />
        <Input
          placeholder={t("Confirm Pin Code")}
          onChangeText={(text) => {
            if (text.length <= 6) {
              setConfirmPinCode(text)
            }
          }}
          value={confirmPinCode}
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
          containerStyle={styles.inputWrapper}
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
        />
        <Button
          title={t("Create Account")}
          onPress={handleSignUp}
          loading={loading} // Show loader
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
        />
      </View>
      <TouchableOpacity onPress={() => router.push({ pathname: "/SignIn", params: { userType } })}>
        <Text style={styles.signInText}>
          {t("Already Have Account")} <Text style={styles.signInHighlight}>{t("Sign In")}</Text>
        </Text>
      </TouchableOpacity>
      <Toast visible={toastVisible} message={toastMessage} type="error" onHide={() => setToastVisible(false)} />
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
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 30,
  },
  logoContainer: {
    marginTop: -40,
  },

  logoImage: {
    width: 130,
    height: 180,
  },
  titleMain: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    lineHeight: 48,
    marginBottom: 25,
    marginTop: -40,
  },
  titleSub: {
    fontSize: 30,
    color: "#FFFFFF",
    marginTop: 10,
    paddingVertical: 10,
  },
  userType: {
    color: "#FFC107",
    fontWeight: "bold",
    fontSize: 40,
    paddingVertical: 10,
    lineHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    borderBottomWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    width: "100%",
  },
  inputText: {
    color: "#FFFFFF",
    paddingLeft: 20,
    fontSize: 18,
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
  labelRTL: {
    textAlign: "right",
    marginRight: 10,
  },
  signInText: {
    color: "#FFFFFF",
    marginTop: 20,
  },
  signInHighlight: {
    color: "#FFC107",
  },
  backButton: {
    position: "absolute",
    top: 20,
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
    color: "red",
    marginTop: 0,
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
  inputWrapper: {
    width: "100%",
    paddingHorizontal: 0,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 5,
  },
})

export default SignUp
