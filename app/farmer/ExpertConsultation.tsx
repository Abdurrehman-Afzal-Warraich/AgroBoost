"use client"

import { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
import { getAuth } from "firebase/auth"
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons"

const ExpertConsultation = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [experts, setExperts] = useState<{ id: string; [key: string]: any }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Record<string, string>>({})
  const [acceptedRequests, setAcceptedRequests] = useState<Record<string, string>>({})
  const [activeExpert, setActiveExpert] = useState<any>(null)
  const [showExpertsModal, setShowExpertsModal] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<Record<string, boolean>>({})
  const [hasActiveConsultation, setHasActiveConsultation] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})

  const auth = getAuth()
  const currentUser = auth.currentUser

  const fetchExperts = async () => {
    setLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "expert"))
      const expertsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setExperts(expertsList)

      // Fetch chat request status for each expert
      if (currentUser) {
        const chatRequestsRef = collection(db, "chatRequests")
        const q = query(chatRequestsRef, where("farmerId", "==", currentUser.uid))

        const requestsSnapshot = await getDocs(q)
        const pendingMap: Record<string, string> = {}
        const acceptedMap: Record<string, string> = {}
        let hasActive = false
        let activeExp = null

        requestsSnapshot.forEach((doc) => {
          const request = doc.data()
          if (request.status === "pending") {
            pendingMap[request.expertId] = doc.id
            hasActive = true
          } else if (request.status === "accepted") {
            acceptedMap[request.expertId] = doc.id
            hasActive = true

            // Find the active expert from the experts list
            const expert = expertsList.find((exp) => exp.id === request.expertId)
            if (expert) {
              activeExp = expert
            }
          }
        })

        setPendingRequests(pendingMap)
        setAcceptedRequests(acceptedMap)
        setHasActiveConsultation(hasActive)
        setActiveExpert(activeExp)

        // Fetch user's ratings
        const ratingsRef = collection(db, "ratings")
        const ratingsQuery = query(ratingsRef, where("farmerId", "==", currentUser.uid))
        const ratingsSnapshot = await getDocs(ratingsQuery)

        const userRatingsMap: Record<string, number> = {}
        ratingsSnapshot.forEach((doc) => {
          const ratingData = doc.data()
          userRatingsMap[ratingData.expertId] = ratingData.rating
        })

        setUserRatings(userRatingsMap)
      }

      console.log("Experts fetched successfully:", expertsList)
    } catch (error) {
      console.error("Error fetching experts:", error)
      Alert.alert(t("Error"), t("Failed to load experts. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExperts()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchExperts().then(() => setRefreshing(false))
  }, [])

  const handleChatRequest = async (expert) => {
    if (!currentUser) {
      Alert.alert(t("Error"), t("You must be logged in to request a consultation."))
      return
    }

    // If chat is already accepted, navigate to chat screen
    if (acceptedRequests[expert.id]) {
      router.push({
        pathname: "/farmer/ChatScreen",
        params: {
          expertId: expert.id,
          expertName: expert.name,
          farmerId: currentUser.uid,
          farmerName: 'farmer'
        },
      })
      return
    }

    // If chat request is pending, show message
    if (pendingRequests[expert.id]) {
      Alert.alert(
        t("Request Pending"),
        t("Your consultation request is pending. Please wait for the expert to accept."),
      )
      return
    }

    // If farmer already has an active consultation or pending request with another expert
    if (hasActiveConsultation && !acceptedRequests[expert.id] && !pendingRequests[expert.id]) {
      Alert.alert(
        t("Active Consultation"),
        t("You can only chat with one expert at a time. Please complete your current consultation first."),
      )
      return
    }

    // Create new chat request
    try {
      setSendingRequest((prev) => ({ ...prev, [expert.id]: true }))

      await addDoc(collection(db, "chatRequests"), {
        farmerId: currentUser.uid,
        expertId: expert.id,
        status: "pending",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })

      // Update local state
      setPendingRequests((prev) => ({
        ...prev,
        [expert.id]: true,
      }))

      setHasActiveConsultation(true)
      setShowExpertsModal(false)

      Alert.alert(t("Request Sent"), t("Your consultation request has been sent successfully."))
    } catch (error) {
      console.error("Error creating chat request:", error)
      Alert.alert(t("Error"), t("Failed to send consultation request. Please try again."))
    } finally {
      setSendingRequest((prev) => ({ ...prev, [expert.id]: false }))
    }
  }

  const handleRateExpert = async () => {
    if (!currentUser || !activeExpert || rating === 0) {
      return
    }

    setSubmittingRating(true)

    try {
      // Get the current expert data
      const expertRef = doc(db, "expert", activeExpert.id)
      const expertDoc = await getDoc(expertRef)

      if (!expertDoc.exists()) {
        throw new Error("Expert not found")
      }

      const expertData = expertDoc.data()
      const currentRating = expertData.rating || 0
      const currentNumberOfRatings = expertData.numberOfRatings || 0

      // Calculate new rating
      let newRating
      let newNumberOfRatings

      if (userRatings[activeExpert.id]) {
        // User is updating their previous rating
        // For simplicity, we're just replacing the old rating with the new one
        // A more complex system would adjust the average based on the previous rating
        newRating =
          (currentRating * currentNumberOfRatings - userRatings[activeExpert.id] + rating) / currentNumberOfRatings
        newNumberOfRatings = currentNumberOfRatings
      } else {
        // User is rating for the first time
        newRating = (currentRating * currentNumberOfRatings + rating) / (currentNumberOfRatings + 1)
        newNumberOfRatings = currentNumberOfRatings + 1
      }

      // Update expert document
      await updateDoc(expertRef, {
        rating: Number(newRating.toFixed(1)),
        numberOfRatings: newNumberOfRatings,
      })

      // Store or update the user's rating
      const ratingsRef = collection(db, "ratings")
      const q = query(ratingsRef, where("farmerId", "==", currentUser.uid), where("expertId", "==", activeExpert.id))

      const ratingSnapshot = await getDocs(q)

      if (ratingSnapshot.empty) {
        // Create new rating document
        await addDoc(ratingsRef, {
          farmerId: currentUser.uid,
          expertId: activeExpert.id,
          rating: rating,
          timestamp: serverTimestamp(),
        })
      } else {
        // Update existing rating document
        const ratingDoc = ratingSnapshot.docs[0]
        await updateDoc(doc(db, "ratings", ratingDoc.id), {
          rating: rating,
          timestamp: serverTimestamp(),
        })
      }

      // Update local state
      setUserRatings((prev) => ({
        ...prev,
        [activeExpert.id]: rating,
      }))

      // Update active expert in local state
      setActiveExpert((prev) => ({
        ...prev,
        rating: Number(newRating.toFixed(1)),
        numberOfRatings: newNumberOfRatings,
      }))

      // Update experts list
      setExperts((prev) =>
        prev.map((exp) =>
          exp.id === activeExpert.id
            ? {
                ...exp,
                rating: Number(newRating.toFixed(1)),
                numberOfRatings: newNumberOfRatings,
              }
            : exp,
        ),
      )

      Alert.alert(t("Rating Submitted"), t("Thank you for rating this expert!"))

      setShowRatingModal(false)
    } catch (error) {
      console.error("Error submitting rating:", error)
      Alert.alert(t("Error"), t("Failed to submit rating. Please try again."))
    } finally {
      setSubmittingRating(false)
    }
  }

  const renderExpertItem = ({ item }) => {
    const isPending = pendingRequests[item.id]
    const isAccepted = acceptedRequests[item.id]
    const isSending = sendingRequest[item.id]

    return (
      <View style={styles.card}>
        <Image
          source={item.profilePic ? { uri: item.profilePic } : require("../../assets/images/badge.png")}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialization}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color="#666" /> {item.city}
          </Text>
          <Text style={styles.experience}>
            <MaterialIcons name="work-outline" size={14} color="#666" /> {t("Experience")}: {item.experienceYears}{" "}
            {t("years")}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <FontAwesome name="star" size={14} color="#FFC107" />
              <Text style={styles.statText}>
                {item?.rating || 0} ({item?.numberOfRatings || 0})
              </Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome name="users" size={14} color="#4CAF50" />
              <Text style={styles.statText}>{item?.totalConsultations || 0}</Text>
            </View>
          </View>

          <View style={styles.badgeContainer}>
            <Image source={require("../../assets/images/badge.png")} style={styles.badge} />
            <Text style={styles.badgeText}>{t("Verified")}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                isPending && styles.pendingButton,
                isAccepted && styles.acceptedButton,
                hasActiveConsultation && !isPending && !isAccepted && styles.disabledButton,
              ]}
              onPress={() => handleChatRequest(item)}
              disabled={isSending || (hasActiveConsultation && !isPending && !isAccepted)}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#1B5E20" />
              ) : (
                <>
                  <Text style={styles.buttonTitle}>
                    {isAccepted ? t("Chat Now") : isPending ? t("Pending") : t("Chat")}
                  </Text>
                  {isAccepted && (
                    <Ionicons name="chatbubble-ellipses" size={18} color="#1B5E20" style={styles.buttonIcon} />
                  )}
                  {isPending && !isSending && (
                    <ActivityIndicator size="small" color="#1B5E20" style={styles.buttonIcon} />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const renderActiveExpert = () => {
    if (!activeExpert) return null

    const isAccepted = acceptedRequests[activeExpert.id]
    const hasRated = userRatings[activeExpert.id] !== undefined

    return (
      <View style={styles.activeExpertCard}>
        <View style={styles.activeExpertHeader}>
          <Text style={styles.activeExpertTitle}>{t("Your Current Expert")}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshIconButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.activeExpertContent}>
          <Image
            source={
              activeExpert.profilePic ? { uri: activeExpert.profilePic } : require("../../assets/images/badge.png")
            }
            style={styles.activeExpertImage}
          />

          <View style={styles.activeExpertInfo}>
            <Text style={styles.activeExpertName}>{activeExpert.name}</Text>
            <Text style={styles.activeExpertSpecialty}>{activeExpert.specialization}</Text>

            <View style={styles.activeExpertStats}>
              <View style={styles.statItem}>
                <FontAwesome name="star" size={14} color="#FFC107" />
                <Text style={styles.statText}>
                  {activeExpert?.rating || 0} ({activeExpert?.numberOfRatings || 0})
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="work-outline" size={14} color="#666" />
                <Text style={styles.statText}>
                  {activeExpert.experienceYears} {t("years")}
                </Text>
              </View>
            </View>

            <View style={styles.badgeContainer}>
              <Image source={require("../../assets/images/badge.png")} style={styles.badge} />
              <Text style={styles.badgeText}>{t("Verified Expert")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.activeExpertFooter}>
          <View style={styles.activeExpertButtonsRow}>
            <TouchableOpacity
              style={[
                styles.activeExpertButton,
                isAccepted ? styles.acceptedButton : styles.pendingButton,
                styles.chatButton,
              ]}
              onPress={() => {
                if (isAccepted) {
                  handleChatRequest(activeExpert)
                }
              }}
              disabled={!isAccepted}
            >
              <Text style={styles.activeExpertButtonText}>
                {isAccepted ? t("Start Chatting") : t("Waiting for Acceptance")}
              </Text>
              {isAccepted ? (
                <Ionicons name="chatbubble-ellipses" size={18} color="#1B5E20" style={styles.buttonIcon} />
              ) : (
                <ActivityIndicator size="small" color="#1B5E20" style={styles.buttonIcon} />
              )}
            </TouchableOpacity>

            {isAccepted && (
              <TouchableOpacity
                style={[styles.activeExpertButton, styles.rateButton]}
                onPress={() => {
                  setRating(userRatings[activeExpert.id] || 0)
                  setShowRatingModal(true)
                }}
              >
                <Text style={styles.rateButtonText}>{hasRated ? t("Update Rating") : t("Rate Expert")}</Text>
                <FontAwesome name="star" size={18} color="#FFC107" style={styles.buttonIcon} />
              </TouchableOpacity>
            )}
          </View>

          {hasRated && (
            <View style={styles.userRatingContainer}>
              <Text style={styles.userRatingText}>{t("Your Rating")}:</Text>
              <View style={styles.userRatingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name={star <= userRatings[activeExpert.id] ? "star" : "star-o"}
                    size={16}
                    color="#FFC107"
                    style={styles.userRatingStar}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderRatingModal = () => {
    return (
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.ratingModalContainer}>
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingModalTitle}>
              {userRatings[activeExpert?.id] ? t("Update Your Rating") : t("Rate This Expert")}
            </Text>

            <Text style={styles.ratingModalSubtitle}>{activeExpert?.name}</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={submittingRating}>
                  <FontAwesome
                    name={star <= rating ? "star" : "star-o"}
                    size={40}
                    color="#FFC107"
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingText}>
              {rating === 0
                ? t("Tap to rate")
                : rating === 1
                  ? t("Poor")
                  : rating === 2
                    ? t("Fair")
                    : rating === 3
                      ? t("Good")
                      : rating === 4
                        ? t("Very Good")
                        : t("Excellent")}
            </Text>

            <View style={styles.ratingModalButtons}>
              <TouchableOpacity
                style={[styles.ratingModalButton, styles.ratingModalCancelButton]}
                onPress={() => setShowRatingModal(false)}
                disabled={submittingRating}
              >
                <Text style={styles.ratingModalCancelButtonText}>{t("Cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ratingModalButton,
                  styles.ratingModalSubmitButton,
                  rating === 0 && styles.ratingModalDisabledButton,
                ]}
                onPress={handleRateExpert}
                disabled={rating === 0 || submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.ratingModalSubmitButtonText}>{t("Submit")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  const renderExpertsModal = () => {
    return (
      <Modal
        visible={showExpertsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpertsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("Available Experts")}</Text>
              <TouchableOpacity onPress={() => setShowExpertsModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#FFC107" style={styles.loader} />
            ) : (
              <FlatList
                data={experts}
                renderItem={renderExpertItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <FontAwesome name="users" size={60} color="#CCCCCC" />
                    <Text style={styles.noData}>{t("No experts available at the moment")}</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                      <Text style={styles.refreshButtonText}>{t("Refresh")}</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFC107" style={styles.loader} />
        ) : (
          <>
            {activeExpert ? (
              renderActiveExpert()
            ) : (
              <View style={styles.noActiveExpertContainer}>
                <Image source={require("../../assets/images/badge.png")} style={styles.noActiveExpertImage} />
                <Text style={styles.noActiveExpertTitle}>{t("No Active Consultation")}</Text>
                <Text style={styles.noActiveExpertDescription}>
                  {t("Connect with agricultural experts for personalized advice and solutions")}
                </Text>
                <TouchableOpacity style={styles.findExpertButton} onPress={() => setShowExpertsModal(true)}>
                  <Text style={styles.findExpertButtonText}>{t("Find an Expert")}</Text>
                  <Ionicons name="search" size={18} color="#fff" style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
            )}

            {!activeExpert && hasActiveConsultation && (
              <View style={styles.pendingRequestBanner}>
                <Ionicons name="time-outline" size={24} color="#FFC107" />
                <Text style={styles.pendingRequestText}>
                  {t("You have a pending consultation request. Please wait for expert acceptance.")}
                </Text>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>{t("How It Works")}</Text>
              <View style={styles.infoStep}>
                <View style={styles.infoStepIcon}>
                  <Text style={styles.infoStepNumber}>1</Text>
                </View>
                <View style={styles.infoStepContent}>
                  <Text style={styles.infoStepTitle}>{t("Choose an Expert")}</Text>
                  <Text style={styles.infoStepDescription}>
                    {t("Browse our verified agricultural experts and select one that matches your needs")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoStep}>
                <View style={styles.infoStepIcon}>
                  <Text style={styles.infoStepNumber}>2</Text>
                </View>
                <View style={styles.infoStepContent}>
                  <Text style={styles.infoStepTitle}>{t("Send a Request")}</Text>
                  <Text style={styles.infoStepDescription}>
                    {t("Request a consultation with your chosen expert and wait for their acceptance")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoStep}>
                <View style={styles.infoStepIcon}>
                  <Text style={styles.infoStepNumber}>3</Text>
                </View>
                <View style={styles.infoStepContent}>
                  <Text style={styles.infoStepTitle}>{t("Start Chatting")}</Text>
                  <Text style={styles.infoStepDescription}>
                    {t("Once accepted, begin your consultation and get personalized advice for your farm")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoStep}>
                <View style={styles.infoStepIcon}>
                  <Text style={styles.infoStepNumber}>4</Text>
                </View>
                <View style={styles.infoStepContent}>
                  <Text style={styles.infoStepTitle}>{t("Rate Your Experience")}</Text>
                  <Text style={styles.infoStepDescription}>
                    {t("After your consultation, rate the expert to help other farmers find quality assistance")}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {renderExpertsModal()}
      {renderRatingModal()}

      {!activeExpert && !loading && (
        <TouchableOpacity style={styles.floatingButton} onPress={() => setShowExpertsModal(true)}>
          <Ionicons name="people" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  loader: {
    marginTop: 50,
  },
  // Card styles
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  specialty: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  experience: {
    fontSize: 14,
    color: "#666",
    flexDirection: "row",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 5,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  badge: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 10,
    width: "70%",
  },
  button: {
    backgroundColor: "#FFC107",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingButton: {
    backgroundColor: "#E0E0E0",
  },
  acceptedButton: {
    backgroundColor: "#A5D6A7",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
    opacity: 0.7,
  },
  buttonTitle: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  buttonIcon: {
    marginLeft: 5,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalList: {
    padding: 15,
  },

  // Active expert styles
  activeExpertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  activeExpertHeader: {
    backgroundColor: "#4CAF50",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeExpertTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  refreshIconButton: {
    padding: 5,
  },
  activeExpertContent: {
    flexDirection: "row",
    padding: 15,
  },
  activeExpertImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  activeExpertInfo: {
    flex: 1,
    justifyContent: "center",
  },
  activeExpertName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  activeExpertSpecialty: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  activeExpertStats: {
    flexDirection: "row",
    marginBottom: 10,
  },
  activeExpertFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  activeExpertButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activeExpertButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  chatButton: {
    flex: 1,
    marginRight: 10,
  },
  rateButton: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  activeExpertButtonText: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 16,
  },
  rateButtonText: {
    color: "#F57F17",
    fontWeight: "bold",
    fontSize: 16,
  },
  userRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  userRatingText: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  userRatingStars: {
    flexDirection: "row",
  },
  userRatingStar: {
    marginHorizontal: 2,
  },

  // Rating modal styles
  ratingModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  ratingModalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  ratingModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  ratingModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingModalCancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: 10,
  },
  ratingModalSubmitButton: {
    backgroundColor: "#4CAF50",
  },
  ratingModalDisabledButton: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  ratingModalCancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  ratingModalSubmitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // No active expert styles
  noActiveExpertContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noActiveExpertImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  noActiveExpertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  noActiveExpertDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  findExpertButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  findExpertButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Pending request banner
  pendingRequestBanner: {
    backgroundColor: "#FFF9C4",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pendingRequestText: {
    color: "#856404",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },

  // Info section
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoStep: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoStepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoStepNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  infoStepContent: {
    flex: 1,
  },
  infoStepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoStepDescription: {
    fontSize: 14,
    color: "#666",
  },

  // Floating button
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Empty state
  emptyContainer: {
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    marginTop: 10,
    fontSize: 16,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
})

export default ExpertConsultation
