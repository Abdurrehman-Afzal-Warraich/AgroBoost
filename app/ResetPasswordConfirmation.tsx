"use client"

import { StyleSheet, View, Text, Image } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Icon, Button } from "react-native-elements"
import { useTranslation } from "react-i18next"

const ResetPasswordConfirmation = () => {
  const router = useRouter()
  const { email, userType } = useLocalSearchParams<{ email: string; userType: string }>()
  const { t, i18n } = useTranslation()

  const isRTL = i18n.language === "ur"

  const handleBackToSignIn = () => {
    router.replace({
      pathname: "/SignIn",
      params: { userType },
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/email-send.jpg")}
          style={styles.image}
          defaultSource={require("../assets/email-send.jpg")}
        />

        <Text style={styles.title}>{t("Check Your Email")}</Text>

        <Text style={styles.emailText}>{email}</Text>

        <Text style={[styles.description, isRTL && styles.rtlText]}>
          {t(
            "We've sent you an email with a link to reset your password. Please check your inbox and follow the instructions.",
          )}
        </Text>

        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsTitle, isRTL && styles.rtlText]}>{t("Next Steps:")}</Text>

          <View style={[styles.instructionItem, isRTL && styles.rtlInstructionItem]}>
            {isRTL ? (
              <>
                <Text style={[styles.instructionText, styles.rtlText]}>{t("Open the email")}</Text>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} style={{ marginLeft: 10 }} />
              </>
            ) : (
              <>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} />
                <Text style={styles.instructionText}>{t("Open the email")}</Text>
              </>
            )}
          </View>

          <View style={[styles.instructionItem, isRTL && styles.rtlInstructionItem]}>
            {isRTL ? (
              <>
                <Text style={[styles.instructionText, styles.rtlText]}>{t("Click the reset link")}</Text>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} style={{ marginLeft: 10 }} />
              </>
            ) : (
              <>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} />
                <Text style={styles.instructionText}>{t("Click the reset link")}</Text>
              </>
            )}
          </View>

          <View style={[styles.instructionItem, isRTL && styles.rtlInstructionItem]}>
            {isRTL ? (
              <>
                <Text style={[styles.instructionText, styles.rtlText]}>{t("Create a new password")}</Text>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} style={{ marginLeft: 10 }} />
              </>
            ) : (
              <>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} />
                <Text style={styles.instructionText}>{t("Create a new password")}</Text>
              </>
            )}
          </View>

          <View style={[styles.instructionItem, isRTL && styles.rtlInstructionItem]}>
            {isRTL ? (
              <>
                <Text style={[styles.instructionText, styles.rtlText]}>{t("Return to the app and sign in")}</Text>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} style={{ marginLeft: 10 }} />
              </>
            ) : (
              <>
                <Icon name="check-circle" type="material" color="#FFC107" size={20} />
                <Text style={styles.instructionText}>{t("Return to the app and sign in")}</Text>
              </>
            )}
          </View>
        </View>

        <Button
          title={t("Back to Sign In")}
          onPress={handleBackToSignIn}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={
            <Icon
              name={isRTL ? "arrow-forward" : "arrow-back"}
              type="material"
              color="#1B5E20"
              size={20}
              style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}
            />
          }
          iconRight={isRTL}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  emailText: {
    fontSize: 18,
    color: "#FFC107",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rtlInstructionItem: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
  },
  instructionText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 10,
  },
  buttonContainer: {
    width: "80%",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FFC107",
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonTitle: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 18,
  },
  rtlText: {
    textAlign: "right",
  },
})

export default ResetPasswordConfirmation
