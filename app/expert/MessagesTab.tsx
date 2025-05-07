"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
import { getAuth } from "firebase/auth"
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  orderBy, 
  addDoc,
  serverTimestamp, 
  increment
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Ionicons } from "@expo/vector-icons"

const MessagesTab = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [chatRequests, setChatRequests] = useState([])
  const [activeConsultations, setActiveConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [farmers, setFarmers] = useState({})

  const auth = getAuth()
  const currentUser = auth.currentUser

  useEffect(() => {
    if (!currentUser) return

    setLoading(true)

    // Fetch pending chat requests
    const requestsRef = collection(db, "chatRequests")
    const requestsQuery = query(requestsRef, where("expertId", "==", currentUser.uid), where("status", "==", "pending"))

    // Fetch active consultations from the consultations collection
    const consultationsRef = collection(db, "consultations")
    const consultationsQuery = query(
      consultationsRef,
      where("expertId", "==", currentUser.uid),
      where("status", "==", "active"),
      orderBy("lastUpdated", "desc")
    )

    // Listen for pending requests
    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requests = []
      const farmerIds = new Set()

      snapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() }
        requests.push(request)
        farmerIds.add(request.farmerId)
      })

      setChatRequests(requests)

      // Fetch farmer info for all requests
      await fetchFarmerInfo(farmerIds)
    })

    // Listen for active consultations
    const unsubscribeConsultations = onSnapshot(consultationsQuery, async (snapshot) => {
      const consultations = []
      const farmerIds = new Set()

      snapshot.forEach((doc) => {
        const consultation = { id: doc.id, ...doc.data() }
        consultations.push(consultation)
        farmerIds.add(consultation.farmerId)
      })

      setActiveConsultations(consultations)

      // Fetch farmer info for all consultations
      await fetchFarmerInfo(farmerIds)
      setLoading(false)
    })

    return () => {
      unsubscribeRequests()
      unsubscribeConsultations()
    }
  }, [currentUser])

  const fetchFarmerInfo = async (farmerIds) => {
    try {
      const newFarmers = { ...farmers }

      for (const farmerId of farmerIds) {
        if (!newFarmers[farmerId]) {
          const farmerDoc = await getDoc(doc(db, "farmer", farmerId))

          if (farmerDoc.exists()) {
            newFarmers[farmerId] = farmerDoc.data()
          }
        }
      }

      setFarmers(newFarmers)
    } catch (error) {
      console.error("Error fetching farmer info:", error)
    }
  }

  const handleAcceptRequest = async (request) => {
    try {
      // Update the chat request status
      await updateDoc(doc(db, "chatRequests", request.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      })

    const docRef = doc(db, "expert", currentUser.uid);

      await updateDoc(docRef, {
      "stats.totalConsultations": increment(1),
    });

      // Create a new entry in the consultations collection
      const consultationData = {
        farmerId: request.farmerId,
        expertId: currentUser.uid,
        status: "active",
        chatRequestId: request.id,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastMessage: "",
        unreadCount: 0,
        farmerName: farmers[request.farmerId]?.name || "Farmer",
        expertName: currentUser.displayName || "Expert",
        topic: "General Consultation"
      }

      const consultationRef = await addDoc(collection(db, "consultations"), consultationData)

      // Navigate to chat screen
      router.push({
        pathname: "/expert/ChatScreen",
        params: {
          farmerId: request.farmerId,
          farmerName: farmers[request.farmerId]?.name || "Farmer",
          requestId: request.id,
          consultationId: consultationRef.id
        },
      })
    } catch (error) {
      console.error("Error accepting request:", error)
      Alert.alert(t("Error"), t("Failed to accept request. Please try again."))
    }
  }

  const handleRejectRequest = async (request) => {
    try {
      await updateDoc(doc(db, "chatRequests", request.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error rejecting request:", error)
      Alert.alert(t("Error"), t("Failed to reject request. Please try again."))
    }
  }

  const handleOpenChat = (consultation) => {
    router.push({
      pathname: "/expert/ChatScreen",
      params: {
        farmerId: consultation.farmerId,
        farmerName: consultation.farmerName || farmers[consultation.farmerId]?.name || "Farmer",
        consultationId: consultation.id,
        chatRequestId: consultation.chatRequestId
      },
    })
  }

  const renderRequestItem = ({ item }) => {
    const farmer = farmers[item.farmerId] || {}

    return (
      <View style={styles.requestCard}>
        <Image
          source={farmer.profilePic ? { uri: farmer.profilePic } : require("../../assets/images/farmer.png")}
          style={styles.farmerImage}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.farmerName}>{farmer.name || t("Farmer")}</Text>
          <Text style={styles.requestTime}>
            {item.createdAt?.toDate().toLocaleString() || new Date().toLocaleString()}
          </Text>
          <Text style={styles.requestMessage}>{t("Requesting consultation")}</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item)}
          >
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderConsultationItem = ({ item }) => {
    const farmer = farmers[item.farmerId] || {}
    const lastMessageTime = item.lastUpdated?.toDate() || new Date()
    const timeString = formatMessageTime(lastMessageTime)

    return (
      <TouchableOpacity style={styles.chatCard} onPress={() => handleOpenChat(item)}>
        <Image
          source={farmer.profilePic ? { uri: farmer.profilePic } : require("../../assets/images/farmer.png")}
          style={styles.farmerImage}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.farmerName}>{item.farmerName || farmer.name || t("Farmer")}</Text>
            <Text style={styles.chatTime}>{timeString}</Text>
          </View>
          <Text style={styles.consultationTopic}>{item.topic || t("General Consultation")}</Text>
          <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
            {item.lastMessage || t("Start chatting")}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const formatMessageTime = (date) => {
    const now = new Date()
    const diff = now - date
    const oneDay = 24 * 60 * 60 * 1000

    if (diff < oneDay) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diff < 2 * oneDay) {
      // Yesterday
      return t("Yesterday")
    } else {
      // Show date
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>{t("Loading messages...")}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {chatRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Consultation Requests")}</Text>
          <FlatList
            data={chatRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            horizontal={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Active Consultations")}</Text>
        {activeConsultations.length > 0 ? (
          <FlatList
            data={activeConsultations}
            renderItem={renderConsultationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>{t("No active consultations")}</Text>
            <Text style={styles.emptySubtext}>{t("When farmers request consultations, they will appear here")}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",  // Adding white background
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  requestCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  farmerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  requestInfo: {
    flex: 1,
    justifyContent: "center",
  },
  farmerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  requestTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  requestMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#FF6B6B",
  },
  chatCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatTime: {
    fontSize: 12,
    color: "#999",
  },
  consultationTopic: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  unreadBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#999",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
})

export default MessagesTab
