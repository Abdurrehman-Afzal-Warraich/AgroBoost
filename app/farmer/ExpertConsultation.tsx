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
} from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
import { getAuth } from "firebase/auth"
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Ionicons, FontAwesome } from "@expo/vector-icons"

const ExpertConsultation = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingRequests, setPendingRequests] = useState({})
  const [acceptedRequests, setAcceptedRequests] = useState({})

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
        const pendingMap = {}
        const acceptedMap = {}

        requestsSnapshot.forEach((doc) => {
          const request = doc.data()
          if (request.status === "pending") {
            pendingMap[request.expertId] = doc.id
          } else if (request.status === "accepted") {
            acceptedMap[request.expertId] = doc.id
          }
        })

        setPendingRequests(pendingMap)
        setAcceptedRequests(acceptedMap)
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
    if (acceptedRequests[expert.id] ) {
      router.push({
        pathname: "/farmer/ChatScreen",
        params: {
          expertId: expert.id,
          expertName: expert.name,
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

    // Create new chat request
    try {
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

      Alert.alert(t("Request Sent"), t("Your consultation request has been sent successfully."))

      
    } catch (error) {
      console.error("Error creating chat request:", error)
      Alert.alert(t("Error"), t("Failed to send consultation request. Please try again."))
    }
  }

  const renderItem = ({ item }) => {
    const isPending = pendingRequests[item.id]
    const isAccepted = acceptedRequests[item.id]

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
            {item.city}
          </Text>
          <Text style={styles.experience}>
            {t("Experience")}: {item.experienceYears} {t("years")}
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
              style={[styles.button, isPending && styles.pendingButton, isAccepted && styles.acceptedButton]}
              onPress={() => handleChatRequest(item)}
            >
              <Text style={styles.buttonTitle}>
                {isAccepted ? t("Chat Now") : isPending ? t("Pending") : t("Chat")}
              </Text>
              {isAccepted && (
                <Ionicons name="chatbubble-ellipses" size={18} color="#1B5E20" style={styles.buttonIcon} />
              )}
              {isPending && <ActivityIndicator size="small" color="#1B5E20" style={styles.buttonIcon} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      

      {loading ? (
        <ActivityIndicator size="large" color="#FFC107" style={styles.loader} />
      ) : (
        <FlatList
          data={experts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <FontAwesome name="users" size={60} color="#CCCCCC" />
                <Text style={styles.noData}>{t("No experts available at the moment")}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                  <Text style={styles.refreshButtonText}>{t("Refresh")}</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
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
    color: "#999",
    marginBottom: 5,
  },
  experience: {
    fontSize: 14,
    color: "#999",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 5,
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
  },
  buttonContainer: {
    marginTop: 10,
    width: "60%",
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
  buttonTitle: {
    color: "#1B5E20",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  buttonIcon: {
    marginLeft: 5,
  },
  noData: {
    textAlign: "center",
    color: "#999",
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
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
