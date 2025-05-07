"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, I18nManager } from "react-native"
import { useTranslation } from "react-i18next"
import { Picker } from "@react-native-picker/picker"
import { Button } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Toast from '../../components/Toast'

interface FormData {
  cropType: string
  growthStage: string
  fieldSize: string
  irrigationType: string
  soilType: string
  waterAvailability: string
  observedProblems: string[]
  rainfallStatus: string
}

interface FormErrors {
  cropType?: string
  growthStage?: string
  fieldSize?: string
  soilType?: string
  waterAvailability?: string
  observedProblems?: string
}

interface RecommendationQuestion {
  id: string
  selected: boolean
}

const FieldManagementScreen = () => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ur"

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    cropType: "",
    growthStage: "",
    fieldSize: "",
    irrigationType: "",
    soilType: "",
    waterAvailability: "",
    observedProblems: [],
    rainfallStatus: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [recommendationQuestions, setRecommendationQuestions] = useState<RecommendationQuestion[]>([
    { id: "fertilizer", selected: false },
    { id: "pestControl", selected: false },
    { id: "irrigation", selected: false },
    { id: "seasonalCare", selected: false },
    { id: "growthStageTips", selected: false },
    { id: "weatherBasedAdvice", selected: false },
  ])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("error")

  // Apply RTL styling if language is Urdu
  useEffect(() => {
    I18nManager.forceRTL(isRTL)
  }, [isRTL])

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof FormErrors]
        return newErrors
      })
    }
  }

  const toggleProblem = (problem: string) => {
    setFormData((prev) => {
      const problems = [...prev.observedProblems]
      const index = problems.indexOf(problem)

      if (index === -1) {
        problems.push(problem)
      } else {
        problems.splice(index, 1)
      }

      return {
        ...prev,
        observedProblems: problems,
      }
    })

    // Clear observed problems error if it exists
    if (formErrors.observedProblems) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.observedProblems
        return newErrors
      })
    }
  }

  const toggleQuestion = (id: string) => {
    setRecommendationQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)))
  }

  const validateStep1 = () => {
    const errors: FormErrors = {}

    if (!formData.cropType) errors.cropType = t("fieldManagement.errors.cropTypeRequired")
    if (!formData.growthStage) errors.growthStage = t("fieldManagement.errors.growthStageRequired")
    if (!formData.fieldSize) {
      errors.fieldSize = t("fieldManagement.errors.fieldSizeRequired")
    } else if (isNaN(Number(formData.fieldSize))) {
      errors.fieldSize = t("fieldManagement.errors.fieldSizeNumber")
    }
    if (!formData.soilType) errors.soilType = t("fieldManagement.errors.soilTypeRequired")
    if (!formData.waterAvailability) errors.waterAvailability = t("fieldManagement.errors.waterAvailabilityRequired")

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const selectedQuestions = recommendationQuestions.filter((q) => q.selected)
    if (selectedQuestions.length === 0) {
      showToast(t("fieldManagement.errors.selectAtLeastOneQuestion"), "error")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    } else {
      showToast(t("fieldManagement.errors.pleaseFixErrors"), "error")
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const generateRecommendations = async () => {
    

    if (!validateStep2()) return

    setLoading(true)
    try {
      console.log("Generating recommendations...")
      console.log("Form Data for Field Management:", formData)
      // In a real app, you would make an API call here
      // For now, we'll simulate a delay and generate mock recommendations
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const selectedQuestions = recommendationQuestions.filter((q) => q.selected)
      const mockRecommendations = selectedQuestions.map((q) => {
        switch (q.id) {
          case "fertilizer":
            return `${t("fieldManagement.questions.fertilizer")} - ${
              formData.cropType === "wheat"
                ? "Apply NPK fertilizer in a ratio of 120:60:60 kg/ha."
                : "Apply balanced fertilizer based on soil test results."
            }`
          case "pestControl":
            return `${t("fieldManagement.questions.pestControl")} - ${
              formData.observedProblems.includes("pest_attack")
                ? "Implement integrated pest management with biological controls."
                : "Monitor regularly for early pest detection."
            }`
          case "irrigation":
            return `${t("fieldManagement.questions.irrigation")} - ${
              formData.waterAvailability === "poor"
                ? "Implement drip irrigation to maximize water efficiency."
                : "Schedule irrigation based on crop water requirements."
            }`
          case "seasonalCare":
            return `${t("fieldManagement.questions.seasonalCare")} - ${
              formData.growthStage === "flowering"
                ? "Ensure adequate pollination and protect from extreme weather."
                : "Focus on weed control and soil moisture management."
            }`
          case "growthStageTips":
            return `${t("fieldManagement.questions.growthStageTips")} - ${
              formData.growthStage === "vegetative"
                ? "Ensure adequate nitrogen supply for leaf development."
                : "Focus on balanced nutrition for optimal yield."
            }`
          case "weatherBasedAdvice":
            return `${t("fieldManagement.questions.weatherBasedAdvice")} - ${
              formData.rainfallStatus === "heavy_rain"
                ? "Ensure proper drainage to prevent waterlogging."
                : "Consider supplemental irrigation if rainfall is insufficient."
            }`
          default:
            return ""
        }
      })

      setRecommendations(mockRecommendations)
      setShowRecommendations(true)
      showToast("Recommendations generated successfully", "success")
    } catch (error) {
      console.error("Error generating recommendations:", error)
      showToast(t("fieldManagement.errors.failedToGetRecommendations"), "error")
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setFormData({
      cropType: "",
      growthStage: "",
      fieldSize: "",
      irrigationType: "",
      soilType: "",
      waterAvailability: "",
      observedProblems: [],
      rainfallStatus: "",
    })
    setRecommendationQuestions(recommendationQuestions.map((q) => ({ ...q, selected: false })))
    setFormErrors({})
    setShowRecommendations(false)
    setStep(1)
  }

  const renderFieldDetailsForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("fieldManagement.fieldDetails")}</Text>

      {/* Crop Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.cropType")}</Text>
        <View style={[styles.pickerContainer, formErrors.cropType ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.cropType}
            onValueChange={(value) => handleFieldChange("cropType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
            <Picker.Item label={t("cropTypes.wheat")} value="wheat" />
            <Picker.Item label={t("cropTypes.rice")} value="rice" />
            <Picker.Item label={t("cropTypes.sugarcane")} value="sugarcane" />
            <Picker.Item label={t("cropTypes.cotton")} value="cotton" />
            <Picker.Item label={t("cropTypes.maize")} value="maize" />
            <Picker.Item label={t("cropTypes.vegetables")} value="vegetables" />
            <Picker.Item label={t("cropTypes.others")} value="others" />
          </Picker>
        </View>
        {formErrors.cropType && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.cropType}</Text>}
      </View>

      {/* Growth Stage */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.growthStage")}</Text>
        <View style={[styles.pickerContainer, formErrors.growthStage ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.growthStage}
            onValueChange={(value) => handleFieldChange("growthStage", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
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

      {/* Field Size */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.fieldSize")}</Text>
        <TextInput
          style={[styles.textInput, formErrors.fieldSize ? styles.inputError : null, isRTL && styles.rtlText]}
          placeholder={t("fieldManagement.enterFieldSize")}
          value={formData.fieldSize}
          onChangeText={(text) => handleFieldChange("fieldSize", text)}
          keyboardType="numeric"
          textAlign={isRTL ? "right" : "left"}
        />
        {formErrors.fieldSize && (
          <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.fieldSize}</Text>
        )}
      </View>

      {/* Irrigation Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.irrigationType")}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.irrigationType}
            onValueChange={(value) => handleFieldChange("irrigationType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
            <Picker.Item label={t("irrigationTypes.canal")} value="canal" />
            <Picker.Item label={t("irrigationTypes.tube_well")} value="tube_well" />
            <Picker.Item label={t("irrigationTypes.rain-fed")} value="rain-fed" />
            <Picker.Item label={t("irrigationTypes.drip_irrigation")} value="drip_irrigation" />
            <Picker.Item label={t("irrigationTypes.others")} value="others" />
          </Picker>
        </View>
      </View>

      {/* Soil Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.soilType")}</Text>
        <View style={[styles.pickerContainer, formErrors.soilType ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.soilType}
            onValueChange={(value) => handleFieldChange("soilType", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
            <Picker.Item label={t("soilTypes.sandy")} value="sandy" />
            <Picker.Item label={t("soilTypes.loamy")} value="loamy" />
            <Picker.Item label={t("soilTypes.clayey")} value="clayey" />
            <Picker.Item label={t("soilTypes.silty")} value="silty" />
            <Picker.Item label={t("soilTypes.saline")} value="saline" />
            <Picker.Item label={t("soilTypes.unknown")} value="unknown" />
          </Picker>
        </View>
        {formErrors.soilType && <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.soilType}</Text>}
      </View>

      {/* Water Availability */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.waterAvailability")}</Text>
        <View style={[styles.pickerContainer, formErrors.waterAvailability ? styles.inputError : null]}>
          <Picker
            selectedValue={formData.waterAvailability}
            onValueChange={(value) => handleFieldChange("waterAvailability", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
            <Picker.Item label={t("waterAvailability.good")} value="good" />
            <Picker.Item label={t("waterAvailability.moderate")} value="moderate" />
            <Picker.Item label={t("waterAvailability.poor")} value="poor" />
          </Picker>
        </View>
        {formErrors.waterAvailability && (
          <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.waterAvailability}</Text>
        )}
      </View>

      {/* Observed Problems */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.observedProblems")}</Text>
        <View style={[styles.checkboxContainer, formErrors.observedProblems ? styles.inputError : null]}>
          {Object.entries(t("observedProblems", { returnObjects: true })).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.checkboxItem,
                formData.observedProblems.includes(key) && styles.checkboxItemSelected,
                isRTL && styles.rtlContainer,
              ]}
              onPress={() => toggleProblem(key)}
            >
              <MaterialCommunityIcons
                name={formData.observedProblems.includes(key) ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={formData.observedProblems.includes(key) ? "#4CAF50" : "#757575"}
                style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
              />
              <Text
                style={[
                  styles.checkboxText,
                  formData.observedProblems.includes(key) && styles.checkboxTextSelected,
                  isRTL && styles.rtlText,
                ]}
              >
                {value as string}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {formErrors.observedProblems && (
          <Text style={[styles.errorText, isRTL && styles.rtlText]}>{formErrors.observedProblems}</Text>
        )}
      </View>

      {/* Rainfall Status */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, isRTL && styles.rtlLabel]}>{t("fieldManagement.rainfallStatus")}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.rainfallStatus}
            onValueChange={(value) => handleFieldChange("rainfallStatus", value)}
            style={[styles.picker, isRTL && styles.rtlText]}
            dropdownIconColor="#4CAF50"
          >
            <Picker.Item label={t("fieldManagement.selectOption")} value="" />
            <Picker.Item label={t("rainfallStatus.heavy_rain")} value="heavy_rain" />
            <Picker.Item label={t("rainfallStatus.light_rain")} value="light_rain" />
            <Picker.Item label={t("rainfallStatus.no_rain")} value="no_rain" />
          </Picker>
        </View>
      </View>

      <Button
        title={t("fieldManagement.next")}
        onPress={handleNext}
        buttonStyle={styles.nextButton}
        containerStyle={styles.buttonContainer}
        icon={
          <MaterialCommunityIcons
            name={isRTL ? "arrow-left" : "arrow-right"}
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}
          />
        }
        iconRight={!isRTL}
        iconPosition={isRTL ? "left" : "right"}
      />
    </View>
  )

  const renderRecommendationQuestionsForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("fieldManagement.recommendationQuestions")}</Text>
      <Text style={[styles.sectionDescription, isRTL && styles.rtlText]}>
        {t("fieldManagement.selectQuestionsDescription")}
      </Text>

      <View style={styles.questionsContainer}>
        {recommendationQuestions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.questionItem,
              question.selected && styles.questionItemSelected,
              isRTL && styles.rtlContainer,
            ]}
            onPress={() => toggleQuestion(question.id)}
          >
            <MaterialCommunityIcons
              name={question.selected ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color={question.selected ? "#4CAF50" : "#757575"}
              style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
            />
            <Text
              style={[styles.questionText, question.selected && styles.questionTextSelected, isRTL && styles.rtlText]}
            >
              {t(`fieldManagement.questions.${question.id}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.buttonRow, isRTL && styles.rtlContainer]}>
        <Button
          title={t("fieldManagement.back")}
          onPress={handleBack}
          buttonStyle={styles.backButton}
          containerStyle={[
            styles.buttonContainer,
            { flex: 1, marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 },
          ]}
          icon={
            <MaterialCommunityIcons
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}
            />
          }
          iconPosition={isRTL ? "right" : "left"}
        />
        <Button
          title={t("fieldManagement.getRecommendations")}
          onPress={generateRecommendations}
          loading={loading}
          disabled={loading}
          buttonStyle={styles.submitButton}
          containerStyle={[styles.buttonContainer, { flex: 2 }]}
        />
      </View>
    </View>
  )

  const renderRecommendations = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t("fieldManagement.yourRecommendations")}</Text>

      <View style={styles.cropInfoContainer}>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="sprout" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>
            {t(`cropTypes.${formData.cropType}`)} • {t(`growthStages.${formData.growthStage}`)}
          </Text>
        </View>
        <View style={[styles.cropInfoItem, isRTL && styles.rtlContainer]}>
          <MaterialCommunityIcons name="water" size={20} color="#4CAF50" />
          <Text style={[styles.cropInfoText, isRTL && styles.rtlText]}>
            {t(`waterAvailability.${formData.waterAvailability}`)} • {t(`soilTypes.${formData.soilType}`)}
          </Text>
        </View>
      </View>

      <View style={styles.recommendationsContainer}>
        {recommendations.map((recommendation, index) => (
          <View key={index} style={[styles.recommendationItem, isRTL && styles.rtlContainer]}>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color="#4CAF50"
              style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
            />
            <Text style={[styles.recommendationText, isRTL && styles.rtlText]}>{recommendation}</Text>
          </View>
        ))}
      </View>

      <Button
        title={t("fieldManagement.startOver")}
        onPress={handleStartOver}
        buttonStyle={styles.startOverButton}
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
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("fieldManagement.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("fieldManagement.subtitle")}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {showRecommendations
          ? renderRecommendations()
          : step === 1
            ? renderFieldDetailsForm()
            : renderRecommendationQuestionsForm()}
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
  sectionDescription: {
    fontSize: 16,
    color: "#666666",
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
    marginLeft: 5,
  },
  rtlLabel: {
    textAlign: "right",
    marginRight: 5,
    marginLeft: 0,
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
    fontSize: 16,
  },
  checkboxContainer: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  checkboxItemSelected: {
    backgroundColor: "#E8F5E9",
    borderRadius: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  checkboxTextSelected: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
  },
  backButton: {
    backgroundColor: "#757575",
    borderRadius: 8,
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
  },
  startOverButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    marginTop: 5,
  },
  inputError: {
    borderColor: "#F44336",
  },
  questionsContainer: {
    marginTop: 10,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FFF9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  questionItemSelected: {
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
  recommendationsContainer: {
    marginTop: 20,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FFF9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
    flex: 1,
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

export default FieldManagementScreen
