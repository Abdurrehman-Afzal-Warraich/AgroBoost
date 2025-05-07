"use client"

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

interface AdviceResponse {
  question: string
  options: string[]
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
  const [adviceResponse, setAdviceResponse] = useState<AdviceResponse[]>([])

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
      // Prepare data for backend
      const requestData = {
        cropType: formData.cropType,
        growthStage: formData.growthStage,
        soilType: formData.soilType,
        issue: formData.issue,
        questions: formData.selectedQuestions,
        language: i18n.language,
      }

      console.log("Sending data to backend:", requestData)

      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate mock response based on the issue
      let mockResponse: AdviceResponse[] = []

      if (formData.issue === "nutrient") {
        mockResponse = [
          {
            question: t("cropAdvice.responses.nutrient.title"),
            options: [
              t("cropAdvice.responses.nutrient.options.applyFertilizer"),
              t("cropAdvice.responses.nutrient.options.soilTest"),
              t("cropAdvice.responses.nutrient.options.foliarSpray"),
            ],
          },
          {
            question: t("cropAdvice.responses.nutrient.preventionTitle"),
            options: [
              t("cropAdvice.responses.nutrient.prevention.regularTesting"),
              t("cropAdvice.responses.nutrient.prevention.organicMatter"),
              t("cropAdvice.responses.nutrient.prevention.balancedNutrition"),
            ],
          },
        ]
      } else if (formData.issue === "water") {
        mockResponse = [
          {
            question: t("cropAdvice.responses.water.title"),
            options: [
              t("cropAdvice.responses.water.options.adjustIrrigation"),
              t("cropAdvice.responses.water.options.improveDrainage"),
              t("cropAdvice.responses.water.options.mulching"),
            ],
          },
          {
            question: t("cropAdvice.responses.water.preventionTitle"),
            options: [
              t("cropAdvice.responses.water.prevention.scheduledIrrigation"),
              t("cropAdvice.responses.water.prevention.rainwaterHarvesting"),
              t("cropAdvice.responses.water.prevention.droughtResistant"),
            ],
          },
        ]
      } else if (formData.issue === "growth") {
        mockResponse = [
          {
            question: t("cropAdvice.responses.growth.title"),
            options: [
              t("cropAdvice.responses.growth.options.checkRoots"),
              t("cropAdvice.responses.growth.options.pruneAffected"),
              t("cropAdvice.responses.growth.options.growthStimulants"),
            ],
          },
          {
            question: t("cropAdvice.responses.growth.preventionTitle"),
            options: [
              t("cropAdvice.responses.growth.prevention.qualitySeeds"),
              t("cropAdvice.responses.growth.prevention.properSpacing"),
              t("cropAdvice.responses.growth.prevention.regularMonitoring"),
            ],
          },
        ]
      } else if (formData.issue === "yield") {
        mockResponse = [
          {
            question: t("cropAdvice.responses.yield.title"),
            options: [
              t("cropAdvice.responses.yield.options.pollinationSupport"),
              t("cropAdvice.responses.yield.options.thinFruits"),
              t("cropAdvice.responses.yield.options.pestControl"),
            ],
          },
          {
            question: t("cropAdvice.responses.yield.preventionTitle"),
            options: [
              t("cropAdvice.responses.yield.prevention.cropRotation"),
              t("cropAdvice.responses.yield.prevention.improvedVarieties"),
              t("cropAdvice.responses.yield.prevention.optimalHarvesting"),
            ],
          },
        ]
      }

      setAdviceResponse(mockResponse)
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
    setShowResponse(false)
  }

  // Render the advice response
  const renderAdviceResponse = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("cropAdvice.yourAdvice")}</Text>

      <View style={styles.cropInfoContainer}>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="sprout" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>
            {t("cropTypes." + formData.cropType)} • {t("growthStages." + formData.growthStage)}
          </Text>
        </View>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="terrain" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>{t("soilTypes." + formData.soilType)}</Text>
        </View>
      </View>

      {adviceResponse.map((response, index) => (
        <View key={index} style={styles.responseSection}>
          <Text style={[styles.responseTitle, isRTL && styles.rtlText]}>{response.question}</Text>
          <View style={styles.optionsContainer}>
            {response.options.map((option, optIndex) => (
              <TouchableOpacity
                key={optIndex}
                style={[
                  styles.optionButton,
                  selectedAnswers.includes(option) && styles.optionButtonSelected,
                  isRTL && styles.rtlContainer,
                ]}
                onPress={() => handleAnswerSelect(option)}
              >
                <MaterialCommunityIcons
                  name={selectedAnswers.includes(option) ? "check-circle" : "circle-outline"}
                  size={20}
                  color={selectedAnswers.includes(option) ? "#FFFFFF" : "#4CAF50"}
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswers.includes(option) && styles.optionTextSelected,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

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
            <Picker.Item label={t("cropTypes.wheat")} value="wheat" />
            <Picker.Item label={t("cropTypes.rice")} value="rice" />
            <Picker.Item label={t("cropTypes.cotton")} value="cotton" />
            <Picker.Item label={t("cropTypes.sugarcane")} value="sugarcane" />
            <Picker.Item label={t("cropTypes.maize")} value="maize" />
            <Picker.Item label={t("cropTypes.vegetables")} value="vegetables" />
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
        <Text style={[styles.label, isRTL && styles.rtlText]}>{t("cropAdvice.soilType")}</Text>
        <View style={[styles.pickerContainer, formErrors.soilType ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.soilType}
            onValueChange={(value) => handleFieldDataChange("soilType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("cropAdvice.selectSoilType")} value="" />
            <Picker.Item label={t("soilTypes.sandy")} value="sandy" />
            <Picker.Item label={t("soilTypes.loamy")} value="loamy" />
            <Picker.Item label={t("soilTypes.clayey")} value="clayey" />
            <Picker.Item label={t("soilTypes.silty")} value="silty" />
            <Picker.Item label={t("soilTypes.saline")} value="saline" />
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
            <Picker.Item label={t("cropAdvice.issueOptions.nutrient")} value="nutrient" />
            <Picker.Item label={t("cropAdvice.issueOptions.water")} value="water" />
            <Picker.Item label={t("cropAdvice.issueOptions.growth")} value="growth" />
            <Picker.Item label={t("cropAdvice.issueOptions.yield")} value="yield" />
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
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
  questionsContainer: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FFF9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  questionButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  questionText: {
    color: "#333333",
    fontSize: 16,
    flex: 1,
  },
  questionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  rtlText: {
    textAlign: "right",
  },
  rtlContainer: {
    flexDirection: "row-reverse",
  },
})

export default CropAdvice
