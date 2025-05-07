"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Platform,
  I18nManager,
} from "react-native"
import { useTranslation } from "react-i18next"
import { Picker } from "@react-native-picker/picker"
import { Button } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import Toast from "../../components/Toast"

// Update API URL to use your machine's IP address instead of localhost
const API_BASE_URL = "http://192.168.1.5:8000" // Replace with your machine's IP address

interface FormData {
  cropType: string
  affectedPart: string
  farmerObservation: string
  image?: string
  language: string
  soilType: string
  growthStage: string
}

interface DiseaseResult {
  disease_name: string
  description: string
  disease_management: string[]
  preventive_measures: string[]
  local_context: string[]
}

const PlantDiseases = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cropType: "",
    affectedPart: "",
    farmerObservation: "",
    language: i18n.language === "ur" ? "Urdu" : "English",
    soilType: "",
    growthStage: "",
  })
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null)
  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")

  const isRTL = i18n.language === "ur"

  // Apply RTL styling if language is Urdu
  useEffect(() => {
    I18nManager.forceRTL(isRTL)
  }, [isRTL])

  // Show toast message
  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // Handle field data changes
  const handleFieldDataChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      showToast(t("plantDiseases.errors.permissionRequired"), "error")
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleFieldDataChange("image", result.assets[0].uri)

        // Clear image error if it exists
        if (formErrors.image) {
          setFormErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.image
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      showToast(t("plantDiseases.errors.imagePickFailed"), "error")
    }
  }

  const validateForm = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    // Required fields
    if (!formData.cropType) errors.cropType = t("plantDiseases.errors.cropTypeRequired")
    if (!formData.affectedPart) errors.affectedPart = t("plantDiseases.errors.affectedPartRequired")
    if (!formData.farmerObservation) errors.farmerObservation = t("plantDiseases.errors.observationRequired")
    if (!formData.image) errors.image = t("plantDiseases.errors.imageRequired")
    if (!formData.soilType) errors.soilType = t("plantDiseases.errors.soilTypeRequired")
    if (!formData.growthStage) errors.growthStage = t("plantDiseases.errors.growthStageRequired")

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast(t("plantDiseases.errors.pleaseFixErrors"), "error")
      return
    }

    setLoading(true)
    try {
      // Create a form data object to send to the API
      const apiFormData = new FormData()

      // Add the image file
      if (formData.image) {
        const fileInfo = await FileSystem.getInfoAsync(formData.image)
        if (fileInfo.exists) {
          const fileNameParts = formData.image.split("/")
          const fileName = fileNameParts[fileNameParts.length - 1]

          // Get the file extension
          const extension = fileName.split(".").pop()?.toLowerCase() || "jpg"
          const fileType = `image/${extension === "jpg" ? "jpeg" : extension}`

          apiFormData.append("image", {
            uri: formData.image,
            name: fileName,
            type: fileType,
          } as any)
        } else {
          throw new Error(t("plantDiseases.errors.imageNotFound"))
        }
      }

      // Add other form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "image" && value) {
          apiFormData.append(key, value)
        }
      })

      console.log("Sending request to:", `${API_BASE_URL}/identify-disease`)

      // Make the API call
      // For now, we'll simulate a successful response
      // In a real app, you would uncomment the fetch call below
      /*
      const response = await fetch(`${API_BASE_URL}/identify-disease`, {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      */

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock result
      const mockResult: DiseaseResult = {
        disease_name: i18n.language === "ur" ? "پتی کا دھبہ" : "Leaf Spot Disease",
        description:
          i18n.language === "ur"
            ? "یہ ایک عام فنگل بیماری ہے جو پتوں پر بھورے یا کالے دھبوں کی شکل میں ظاہر ہوتی ہے۔ یہ نمی والے حالات میں پھیلتی ہے اور فصل کی پیداوار کو کم کر سکتی ہے۔"
            : "This is a common fungal disease that appears as brown or black spots on leaves. It thrives in humid conditions and can reduce crop yield if left untreated.",
        disease_management: [
          i18n.language === "ur" ? "متاثرہ پتوں کو ہٹا دیں اور تلف کر دیں" : "Remove and destroy affected leaves",
          i18n.language === "ur"
            ? "فنگسائیڈ سپرے کا استعمال کریں جیسے کاپر آکسی کلورائیڈ"
            : "Apply fungicide spray such as copper oxychloride",
          i18n.language === "ur" ? "پودوں کے درمیان مناسب فاصلہ رکھیں" : "Maintain proper spacing between plants",
        ],
        preventive_measures: [
          i18n.language === "ur" ? "فصل کی گردش کا استعمال کریں" : "Use crop rotation",
          i18n.language === "ur" ? "مزاحم اقسام لگائیں" : "Plant resistant varieties",
          i18n.language === "ur" ? "اچھی نکاسی کو یقینی بنائیں" : "Ensure good drainage",
          i18n.language === "ur" ? "متوازن کھاد کا استعمال کریں" : "Use balanced fertilization",
        ],
        local_context: [
          i18n.language === "ur"
            ? "پنجاب میں، یہ بیماری بارش کے موسم میں زیادہ عام ہے"
            : "In Punjab, this disease is more common during the rainy season",
          i18n.language === "ur"
            ? "مقامی کسان نیم کے تیل کا سپرے بھی استعمال کرتے ہیں"
            : "Local farmers also use neem oil spray",
          i18n.language === "ur"
            ? "اگلی فصل کے لیے بیج کو صحت مند پودوں سے لیں"
            : "Source seeds from healthy plants for the next crop",
        ],
      }

      setDiseaseResult(mockResult)
      setResultModalVisible(true)
      showToast(t("plantDiseases.diseaseIdentified"), "success")
    } catch (error: unknown) {
      console.error("API Error:", error)
      const errorMessage = error instanceof Error ? error.message : t("plantDiseases.errors.unknownError")
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  const renderResultModal = () => {
    if (!diseaseResult) return null

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={resultModalVisible}
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="leaf" size={32} color="#FFFFFF" />
              <Text style={styles.modalTitle}>{diseaseResult.disease_name}</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t("plantDiseases.results.description")}
              </Text>
              <Text style={[styles.descriptionText, isRTL && styles.rtlText]}>{diseaseResult.description}</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t("plantDiseases.results.diseaseManagement")}
              </Text>
              {diseaseResult.disease_management.map((item, index) => (
                <View key={`management-${index}`} style={[styles.listItemContainer, isRTL && styles.rtlContainer]}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#4CAF50"
                    style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                  />
                  <Text style={[styles.listItem, isRTL && styles.rtlText]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t("plantDiseases.results.preventiveMeasures")}
              </Text>
              {diseaseResult.preventive_measures.map((item, index) => (
                <View key={`preventive-${index}`} style={[styles.listItemContainer, isRTL && styles.rtlContainer]}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={20}
                    color="#4CAF50"
                    style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                  />
                  <Text style={[styles.listItem, isRTL && styles.rtlText]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t("plantDiseases.results.localContext")}
              </Text>
              {diseaseResult.local_context.map((item, index) => (
                <View key={`local-${index}`} style={[styles.listItemContainer, isRTL && styles.rtlContainer]}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#4CAF50"
                    style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                  />
                  <Text style={[styles.listItem, isRTL && styles.rtlText]}>{item}</Text>
                </View>
              ))}
            </View>

            <Button
              title={t("plantDiseases.results.close")}
              onPress={() => setResultModalVisible(false)}
              buttonStyle={styles.closeButton}
              containerStyle={styles.buttonContainer}
              icon={
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}
                />
              }
              iconPosition={isRTL ? "right" : "left"}
            />
          </ScrollView>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("plantDiseases.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("plantDiseases.subtitle")}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          {/* Crop Type */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.cropType")}</Text>
            <View style={[styles.pickerContainer, formErrors.cropType ? styles.inputError : null]}>
              <Picker
                selectedValue={formData.cropType}
                onValueChange={(value) => handleFieldDataChange("cropType", value)}
                style={[styles.picker, isRTL && styles.rtlText]}
                dropdownIconColor="#4CAF50"
              >
                <Picker.Item label={t("plantDiseases.selectCrop")} value="" />
                <Picker.Item label={t("cropTypes.wheat")} value="wheat" />
                <Picker.Item label={t("cropTypes.rice")} value="rice" />
                <Picker.Item label={t("cropTypes.cotton")} value="cotton" />
                <Picker.Item label={t("cropTypes.sugarcane")} value="sugarcane" />
                <Picker.Item label={t("cropTypes.maize")} value="maize" />
                <Picker.Item label={t("cropTypes.vegetables")} value="vegetables" />
              </Picker>
            </View>
            {formErrors.cropType && (
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.cropType}</Text>
            )}
          </View>

          {/* Growth Stage */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.growthStage")}</Text>
            <View style={[styles.pickerContainer, formErrors.growthStage ? styles.inputError : null]}>
              <Picker
                selectedValue={formData.growthStage}
                onValueChange={(value) => handleFieldDataChange("growthStage", value)}
                style={[styles.picker, isRTL && styles.rtlText]}
                dropdownIconColor="#4CAF50"
              >
                <Picker.Item label={t("plantDiseases.selectGrowthStage")} value="" />
                <Picker.Item label={t("growthStages.sowing")} value="sowing" />
                <Picker.Item label={t("growthStages.germination")} value="germination" />
                <Picker.Item label={t("growthStages.vegetative")} value="vegetative" />
                <Picker.Item label={t("growthStages.flowering")} value="flowering" />
                <Picker.Item label={t("growthStages.maturity")} value="maturity" />
                <Picker.Item label={t("growthStages.harvesting")} value="harvesting" />
              </Picker>
            </View>
            {formErrors.growthStage && (
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.growthStage}</Text>
            )}
          </View>

          {/* Soil Type */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.soilType")}</Text>
            <View style={[styles.pickerContainer, formErrors.soilType ? styles.inputError : null]}>
              <Picker
                selectedValue={formData.soilType}
                onValueChange={(value) => handleFieldDataChange("soilType", value)}
                style={[styles.picker, isRTL && styles.rtlText]}
                dropdownIconColor="#4CAF50"
              >
                <Picker.Item label={t("plantDiseases.selectSoilType")} value="" />
                <Picker.Item label={t("soilTypes.sandy")} value="sandy" />
                <Picker.Item label={t("soilTypes.loamy")} value="loamy" />
                <Picker.Item label={t("soilTypes.clayey")} value="clayey" />
                <Picker.Item label={t("soilTypes.silty")} value="silty" />
                <Picker.Item label={t("soilTypes.saline")} value="saline" />
              </Picker>
            </View>
            {formErrors.soilType && (
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.soilType}</Text>
            )}
          </View>

          {/* Affected Part */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.affectedPart")}</Text>
            <View style={[styles.pickerContainer, formErrors.affectedPart ? styles.inputError : null]}>
              <Picker
                selectedValue={formData.affectedPart}
                onValueChange={(value) => handleFieldDataChange("affectedPart", value)}
                style={[styles.picker, isRTL && styles.rtlText]}
                dropdownIconColor="#4CAF50"
              >
                <Picker.Item label={t("plantDiseases.selectAffectedPart")} value="" />
                <Picker.Item label={t("plantDiseases.affectedParts.leaves")} value="leaves" />
                <Picker.Item label={t("plantDiseases.affectedParts.stem")} value="stem" />
                <Picker.Item label={t("plantDiseases.affectedParts.roots")} value="roots" />
                <Picker.Item label={t("plantDiseases.affectedParts.flowers")} value="flowers" />
                <Picker.Item label={t("plantDiseases.affectedParts.fruits")} value="fruits" />
                <Picker.Item label={t("plantDiseases.affectedParts.wholePlant")} value="whole_plant" />
              </Picker>
            </View>
            {formErrors.affectedPart && (
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.affectedPart}</Text>
            )}
          </View>

          {/* Farmer Observation */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.farmerObservation")}</Text>
            <TextInput
              style={[
                styles.textInput,
                formErrors.farmerObservation ? styles.inputError : null,
                isRTL && styles.rtlText,
              ]}
              placeholder={t("plantDiseases.farmerObservationPlaceholder")}
              value={formData.farmerObservation}
              onChangeText={(text) => handleFieldDataChange("farmerObservation", text)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              textAlign={isRTL ? "right" : "left"}
            />
            {formErrors.farmerObservation && (
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.farmerObservation}</Text>
            )}
          </View>

          {/* Language Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.language")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.language}
                onValueChange={(value) => handleFieldDataChange("language", value)}
                style={[styles.picker, isRTL && styles.rtlText]}
                dropdownIconColor="#4CAF50"
              >
                <Picker.Item label="English" value="English" />
                <Picker.Item label="اردو (Urdu)" value="Urdu" />
                <Picker.Item label="پنجابی (Punjabi)" value="Punjabi" />
              </Picker>
            </View>
          </View>

          {/* Image Upload */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t("plantDiseases.uploadImage")}</Text>
            <TouchableOpacity
              style={[styles.imageUploadButton, formErrors.image ? styles.inputError : null]}
              onPress={handleImagePick}
            >
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={40} color="#4CAF50" />
                  <Text style={[styles.imageUploadText, isRTL && styles.rtlText]}>{t("plantDiseases.addPhoto")}</Text>
                </View>
              )}
            </TouchableOpacity>
            {formErrors.image && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.image}</Text>}
          </View>

          <Button
            title={loading ? t("common.loading") : t("common.submit")}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            buttonStyle={styles.submitButton}
            containerStyle={styles.buttonContainer}
          />
        </View>
      </ScrollView>

      {renderResultModal()}
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#4CAF50",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8F5E9",
    textAlign: "center",
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    minHeight: 120,
    fontSize: 16,
  },
  imageUploadButton: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
    borderRadius: 8,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FFF9",
    overflow: "hidden",
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageUploadText: {
    color: "#4CAF50",
    fontSize: 16,
    marginTop: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    marginTop: 5,
  },
  inputError: {
    borderColor: "#F44336",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  modalContent: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  modalHeader: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  resultSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  listItemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
    flex: 1,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
  },
  rtlText: {
    textAlign: "right",
  },
  rtlContainer: {
    flexDirection: "row-reverse",
  },
})

export default PlantDiseases
