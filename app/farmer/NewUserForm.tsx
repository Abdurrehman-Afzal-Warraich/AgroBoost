"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { Input, Button, Icon } from "react-native-elements"
import { getAuth } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { Toast } from "../components/Toast"
import { Picker } from "@react-native-picker/picker"
import * as Location from "expo-location"
import { useUser } from "../context/UserProvider"

const NewUserForm = () => {
  const { t, i18n } = useTranslation()
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [budget, setBudget] = useState("")
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const { userName, userType, email } = useUser()

  const isRTL = i18n.language === "ur"

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        showToast(t("Permission to access location was denied"), "error")
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      setLocation(currentLocation)

      // Get address from coordinates
      if (currentLocation) {
        try {
          const [addressObj] = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          })
          if (addressObj) {
            setAddress(`${addressObj.street || ""}, ${addressObj.city || ""}, ${addressObj.region || ""}`)
          }
        } catch (error) {
          console.error("Error getting address:", error)
        }
      }
    })()
  }, [])

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const handlePhoneNumberChange = (text: string) => {
    // Only allow numbers and limit to 10 digits
    const cleaned = text.replace(/[^0-9]/g, "")
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned)
    }
  }

  const handleBudgetChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, "")
    setBudget(cleaned)
  }

  const validateForm = () => {
    if (!phoneNumber.trim() || phoneNumber.length !== 10) {
      showToast(t("Please enter a valid 10-digit phone number"), "error")
      return false
    }

    if (!city) {
      showToast(t("Please select your city"), "error")
      return false
    }

    if (!address.trim()) {
      showToast(t("Please enter your address"), "error")
      return false
    }

    if (!budget.trim()) {
      showToast(t("Please enter your budget"), "error")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (user) {
        const userTypeRef = doc(db, "farmer", user.uid)
        await setDoc(
          userTypeRef,
          {
            name: userName,
            userType,
            email,
            city,
            address,
            budget: Number(budget),
            consultations: 0,
            coins: 0,
            profilePicture: "",
            phoneNumber: `+92${phoneNumber}`,
            location: location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }
              : null,
            isNewUser: false,
          },
          { merge: true },
        )

        showToast(t("User details saved successfully"), "success")

        // Use setTimeout to ensure the toast is visible before navigation
        setTimeout(() => {
          router.replace("/farmer/dashboard")
        }, 1000)
      } else {
        showToast(t("User not authenticated"), "error")
      }
    } catch (error) {
      console.error("Error saving user details:", error)
      showToast(t("An error occurred while saving user details."), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>
          {t("New Farmer")} <Text style={styles.userType}>{t("Profile")}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Input
            placeholder={t("Phone Number")}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="numeric"
            leftIcon={
              isRTL ? null : (
                <View style={styles.iconContainer}>
                  <Image source={require("../../assets/pakistan-flag.jpg")} style={styles.flagIcon} />
                  <Text style={styles.countryCode}>+92</Text>
                  <View style={styles.separator} />
                </View>
              )
            }
            rightIcon={
              isRTL ? (
                <View style={styles.iconContainer}>
                  <View style={styles.separator} />
                  <Text style={styles.countryCode}>+92</Text>
                  <Image source={require("../../assets/pakistan-flag.jpg")} style={styles.flagIcon} />
                </View>
              ) : null
            }
            containerStyle={styles.inputField}
            inputContainerStyle={{ borderBottomWidth: 0 }}
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
        </View>

        <View style={styles.inputContainer}>
          <Input
            placeholder={t("Budget (PKR)")}
            value={budget}
            onChangeText={handleBudgetChange}
            keyboardType="numeric"
            leftIcon={
              isRTL ? null : (
                <View style={styles.iconContainer}>
                  <Icon name="attach-money" type="material" color="#FFFFFF" />
                  <View style={styles.separator} />
                </View>
              )
            }
            rightIcon={
              isRTL ? (
                <View style={styles.iconContainer}>
                  <View style={styles.separator} />
                  <Icon name="attach-money" type="material" color="#FFFFFF" />
                </View>
              ) : null
            }
            containerStyle={styles.inputField}
            inputContainerStyle={{ borderBottomWidth: 0 }}
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
        </View>

        <Text style={[styles.label, isRTL && styles.labelRTL]}>{t("City")}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={city}
            style={[styles.picker, isRTL && styles.pickerRTL]}
            onValueChange={(itemValue: string) => setCity(itemValue)}
            dropdownIconColor="#FFFFFF"
          >
            <Picker.Item label={t("Select City")} value="" />
            <Picker.Item label={t("Lahore")} value="Lahore" />
            <Picker.Item label={t("Faisalabad")} value="Faisalabad" />
            <Picker.Item label={t("Rawalpindi")} value="Rawalpindi" />
            <Picker.Item label={t("Gujranwala")} value="Gujranwala" />
            <Picker.Item label={t("Multan")} value="Multan" />
            <Picker.Item label={t("Sargodha")} value="Sargodha" />
            <Picker.Item label={t("Sialkot")} value="Sialkot" />
            <Picker.Item label={t("Bahawalpur")} value="Bahawalpur" />
            <Picker.Item label={t("Sahiwal")} value="Sahiwal" />
            <Picker.Item label={t("Sheikhupura")} value="Sheikhupura" />
            <Picker.Item label={t("Jhang")} value="Jhang" />
            <Picker.Item label={t("Rahim Yar Khan")} value="Rahim Yar Khan" />
            <Picker.Item label={t("Kasur")} value="Kasur" />
            <Picker.Item label={t("Okara")} value="Okara" />
          </Picker>
        </View>

        <View style={styles.inputContainer}>
          <Input
            placeholder={t("Address")}
            value={address}
            onChangeText={setAddress}
            multiline
            leftIcon={
              isRTL ? null : (
                <View style={styles.iconContainer}>
                  <Icon name="location-on" type="material" color="#FFFFFF" />
                  <View style={styles.separator} />
                </View>
              )
            }
            rightIcon={
              isRTL ? (
                <View style={styles.iconContainer}>
                  <View style={styles.separator} />
                  <Icon name="location-on" type="material" color="#FFFFFF" />
                </View>
              ) : null
            }
            containerStyle={styles.inputField}
            inputContainerStyle={{ borderBottomWidth: 0 }}
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
        </View>

        <Button
          title={t("Submit")}
          onPress={handleSubmit}
          loading={loading}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
        />
      </View>

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
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 30,
    marginBottom: 30,
  },
  titleMain: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 5,
    lineHeight: 44,
  },
  userType: {
    color: "#FFC107",
    fontWeight: "bold",
    fontSize: 40,
    paddingVertical: 10,
    lineHeight: 45,
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 10,
  },
  labelRTL: {
    textAlign: "right",
    marginRight: 10,
    marginLeft: 0,
  },
  inputField: {
    borderBottomWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 53,
    width: "100%",
  },
  inputText: {
    color: "#FFFFFF",
    paddingLeft: 20,
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: 20,
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
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
  },
  pickerRTL: {
    textAlign: "right",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
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
})

export default NewUserForm
