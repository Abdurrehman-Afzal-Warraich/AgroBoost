import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, I18nManager } from "react-native"
import { useTranslation } from "react-i18next"
import { Picker } from "@react-native-picker/picker"
import { Button } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Toast from "../../components/Toast"

interface FormData {
  cropType: string
  growthStage: string
  soilType: string
  issue: string
  selectedQuestions: string[]
}

const CropAdvice = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    cropType: "",
    growthStage: "",
    soilType: "",
    issue: "",
    selectedQuestions: [],
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")
  
  // Replace mock response with actual API response
  const [apiRecommendations, setApiRecommendations] = useState<string[]>([])

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
    if (field === "issue") {
      // Reset selected questions when issue changes
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        selectedQuestions: [],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Questions for each issue type
  const questions = {
    nutrient: [
      t("cropAdvice.questions.nutrient.colorChanges"),
      t("cropAdvice.questions.nutrient.symptomsLocation"),
      t("cropAdvice.questions.nutrient.recentFertilizers"),
    ],
    water: [
      t("cropAdvice.questions.water.irrigationFrequency"),
      t("cropAdvice.questions.water.waterlogging"),
      t("cropAdvice.questions.water.wilting"),
    ],
    growth: [
      t("cropAdvice.questions.growth.stuntedGrowth"),
      t("cropAdvice.questions.growth.deformities"),
      t("cropAdvice.questions.growth.firstNoticed"),
    ],
    yield: [
      t("cropAdvice.questions.yield.comparison"),
      t("cropAdvice.questions.yield.fruitSize"),
      t("cropAdvice.questions.yield.pestDamage"),
    ],
    pest: [
      "How to control pests?",
      "What types of pests affect this crop?",
      "Are there natural pest control methods?",
    ],
  }

  // Toggle question selection
  const toggleQuestion = (question: string) => {
    setFormData((prev) => {
      const selectedQuestions = [...prev.selectedQuestions]
      const index = selectedQuestions.indexOf(question)

      if (index === -1) {
        selectedQuestions.push(question)
      } else {
        selectedQuestions.splice(index, 1)
      }

      return {
        ...prev,
        selectedQuestions,
      }
    })

    // Clear error for selectedQuestions if it exists
    if (formErrors.selectedQuestions) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.selectedQuestions
        return newErrors
      })
    }
  }

  // Toggle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => {
      if (prev.includes(answer)) {
        return prev.filter((a) => a !== answer)
      }
      return [...prev, answer]
    })
  }

  // Validate form
  const validateForm = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    // Required fields
    if (!formData.cropType) errors.cropType = t("cropAdvice.errors.cropTypeRequired")
    if (!formData.growthStage) errors.growthStage = t("cropAdvice.errors.growthStageRequired")
    if (!formData.soilType) errors.soilType = t("cropAdvice.errors.soilTypeRequired")
    if (!formData.issue) errors.issue = t("cropAdvice.errors.issueRequired")

    // Only check for selected questions if an issue is selected
    if (formData.issue && formData.selectedQuestions.length === 0) {
      errors.selectedQuestions = t("cropAdvice.errors.questionsRequired")
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast(t("cropAdvice.errors.pleaseFixErrors"), "error")
      return
    }

    setLoading(true)
    try {
      // Prepare data for backend API
      const requestData = {
        crop_type: formData.cropType,
        growth_stage: formData.growthStage,
        soil_type: formData.soilType,
        issue: formData.issue,
        language: i18n.language,
        selected_question: formData.selectedQuestions[0] || ""  // Taking first question for simplicity
      }

      console.log("Sending data to backend:", requestData)

      // API call to backend
      const response = await fetch('http://192.168.1.10:8000/recommendations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`API error with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data)
      
      // Store the recommendations from API
      setApiRecommendations(data)
      setShowResponse(true)
      showToast(t("cropAdvice.adviceGenerated"), "success")
    } catch (error) {
      console.error("Error getting advice:", error)
      showToast(t("cropAdvice.errors.submissionFailed"), "error")
    } finally {
      setLoading(false)
    }
  }

  // Reset form and start over
  const handleReset = () => {
    setFormData({
      cropType: "",
      growthStage: "",
      soilType: "",
      issue: "",
      selectedQuestions: [],
    })
    setFormErrors({})
    setSelectedAnswers([])
    setApiRecommendations([])
    setShowResponse(false)
  }

  // Add this function before the renderAdviceResponse function
  const formatRecommendation = (text: string) => {
    // Check if the text starts with ** to format as a header
    if (text.startsWith('**')) {
      const titleEnd = text.indexOf(':**')
      if (titleEnd !== -1) {
        const title = text.substring(2, titleEnd)
        const content = text.substring(titleEnd + 3)
        return (
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>{title}</Text>
            <Text style={[styles.recommendationText, isRTL && styles.rtlText]}>{content}</Text>
          </View>
        )
      }
    }
    // Default case: return the text as is
    return <Text style={[styles.recommendationText, isRTL && styles.rtlText]}>{text}</Text>
  }

  // Render the advice response
  const renderAdviceResponse = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("cropAdvice.yourAdvice")}</Text>

      <View style={styles.cropInfoContainer}>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="sprout" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>
            {formData.cropType} • {formData.growthStage}
          </Text>
        </View>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="terrain" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>{formData.soilType}</Text>
        </View>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FFC107" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>{formData.issue}</Text>
        </View>
      </View>

      {/* Display API recommendations */}
      <ScrollView style={styles.recommendationsContainer}>
        {apiRecommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            {formatRecommendation(recommendation)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <Button
          title={t("cropAdvice.getMoreAdvice")}
          onPress={handleReset}
          buttonStyle={styles.resetButton}
          containerStyle={styles.buttonContainer}
          icon={
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}
            />
          }
          iconPosition={isRTL ? "right" : "left"}
        />
      </View>
    </View>
  )

  // Render the crop advice form
  const renderCropAdviceForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("cropAdvice.formTitle")}</Text>

      {/* Crop Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.cropType")}</Text>
        <View style={[styles.pickerContainer, formErrors.cropType ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.cropType}
            onValueChange={(value) => handleFieldDataChange("cropType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("cropAdvice.selectCrop")} value="" />
            <Picker.Item label="Wheat" value="Wheat" />
            <Picker.Item label="Rice" value="Rice" />
            <Picker.Item label="Cotton" value="Cotton" />
            <Picker.Item label="Sugarcane" value="Sugarcane" />
            <Picker.Item label="Maize" value="Maize" />
            <Picker.Item label="Vegetables" value="Vegetables" />
          </Picker>
        </View>
        {formErrors.cropType && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.cropType}</Text>}
      </View>

      {/* Growth Stage */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.growthStage")}</Text>
        <View style={[styles.pickerContainer, formErrors.growthStage ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.growthStage}
            onValueChange={(value) => handleFieldDataChange("growthStage", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("cropAdvice.selectGrowthStage")} value="" />
            <Picker.Item label="Sowing" value="Sowing" />
            <Picker.Item label="Germination" value="Germination" />
            <Picker.Item label="Vegetative" value="Vegetative" />
            <Picker.Item label="Flowering" value="Flowering" />
            <Picker.Item label="Maturity" value="Maturity" />
            <Picker.Item label="Harvesting" value="Harvesting" />
          </Picker>
        </View>
        {formErrors.growthStage && (
          <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.growthStage}</Text>
        )}
      </View>

      {/* Soil Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.soilType")}</Text>
        <View style={[styles.pickerContainer, formErrors.soilType ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.soilType}
            onValueChange={(value) => handleFieldDataChange("soilType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("cropAdvice.selectSoilType")} value="" />
            <Picker.Item label="Sandy" value="Sandy" />
            <Picker.Item label="Loamy" value="Loamy" />
            <Picker.Item label="Clayey" value="Clayey" />
            <Picker.Item label="Silty" value="Silty" />
            <Picker.Item label="Saline" value="Saline" />
          </Picker>
        </View>
        {formErrors.soilType && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.soilType}</Text>}
      </View>

      {/* Issue */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.issue")}</Text>
        <View style={[styles.pickerContainer, formErrors.issue ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.issue}
            onValueChange={(value) => handleFieldDataChange("issue", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("cropAdvice.selectIssue")} value="" />
            <Picker.Item label="Nutrient Deficiency" value="nutrient" />
            <Picker.Item label="Water Issues" value="water" />
            <Picker.Item label="Growth Problems" value="growth" />
            <Picker.Item label="Yield Issues" value="yield" />
            <Picker.Item label="Pest Infestation" value="pest" />
          </Picker>
        </View>
        {formErrors.issue && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.issue}</Text>}
      </View>

      {/* Questions Selection */}
      {formData.issue && questions[formData.issue as keyof typeof questions] && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.selectQuestions")}</Text>
          <View style={[styles.questionsContainer, formErrors.selectedQuestions ? styles.inputError : null]}>
            {questions[formData.issue as keyof typeof questions].map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionButton,
                  formData.selectedQuestions.includes(question) && styles.questionButtonSelected,
                  isRTL && styles.rtlContainer,
                ]}
                onPress={() => toggleQuestion(question)}
              >
                <MaterialCommunityIcons
                  name={formData.selectedQuestions.includes(question) ? "check-circle" : "circle-outline"}
                  size={20}
                  color={formData.selectedQuestions.includes(question) ? "#FFFFFF" : "#4CAF50"}
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.questionText,
                    formData.selectedQuestions.includes(question) && styles.questionTextSelected,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {question}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formErrors.selectedQuestions && (
            <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.selectedQuestions}</Text>
          )}
        </View>
      )}

      <Button
        title={loading ? t("common.loading") : t("common.submit")}
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        buttonStyle={styles.submitButton}
        containerStyle={styles.buttonContainer}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("cropAdvice.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("cropAdvice.subtitle")}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {showResponse ? renderAdviceResponse() : renderCropAdviceForm()}
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: 50,
  },
  questionsContainer: {
    marginTop: 10,
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  questionButtonSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  questionText: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  questionTextSelected: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
  },
  resetButton: {
    backgroundColor: "#4CAF50",
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
  responseSection: {
    marginBottom: 20,
    backgroundColor: "#F9FFF9",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  optionButtonSelected: {
    backgroundColor: "#FFC107",
  },
  optionText: {
    color: "#333333",
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    color: "#333333",
    fontWeight: "bold",
  },
  buttonRow: {
    marginTop: 20,
  },
  cropInfoContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  cropInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cropInfoText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 10,
  },
  recommendationsContainer: {
    marginTop: 20,
  },
  recommendationItem: {
    backgroundColor: "#F9FFF9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  rtlText: {
    textAlign: "right",
  },
  rtlContainer: {
    flexDirection: "row-reverse",
  },
})

export default CropAdvice
