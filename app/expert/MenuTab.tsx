"use client"

import { useState, useEffect, useCallback } from "react"
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, RefreshControl } from "react-native"
import { useUser } from "../context/UserProvider"
import { useTranslation } from "react-i18next"
import { Card } from "react-native-elements"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, type Timestamp, limit } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { getAuth } from "firebase/auth"
import { useExpert } from "./hooks/fetch_expert"
import { useRouter } from "expo-router"

interface Consultation {
  id: string
  farmerId: string
  farmerName: string
  expertId: string
  status: "active" | "completed"
  createdAt: Timestamp
  lastUpdated: Timestamp
  lastMessage?: string
  topic?: string
  unreadCount?: number
}

interface ExpertStats {
  pendingConsultations: number
  activeConsultations: number
  completedConsultations: number
  rating: number
}

const MenuTab = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { userName, userType, email, city, experienceYears, isLoading, reloadUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { profileData, updateProfilePicture } = useExpert()

  const [stats, setStats] = useState<ExpertStats>({
    pendingConsultations: 0,
    activeConsultations: 0,
    completedConsultations: 0,
    rating: 0,
  })
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([])
  const [coins, setCoins] = useState(120)
  const [activeConsultations, setActiveConsultations] = useState(0)

  const isRTL = i18n.language === "ur"

  const fetchData = useCallback(async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (user) {
      // Fetch expert stats
      const expertRef = doc(db, "expert", user.uid)
      try {
        const docSnap = await getDoc(expertRef)
        if (docSnap.exists()) {
          const expertData = docSnap.data()
          setStats({
            pendingConsultations: expertData.stats?.pendingConsultations || 0,
            activeConsultations: expertData.stats?.activeConsultations || 0,
            completedConsultations: expertData.stats?.completedConsultations || 0,
            rating: expertData.stats?.rating || 0,
          })
          if (expertData.coins) {
            setCoins(expertData.coins)
          }
        }
      } catch (error) {
        console.error("Error fetching expert data:", error)
      }
    }
  }, [])

  const getExpertConsultationCount = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (user) {
      const consultationsRef = collection(db, "consultations")
      const q = query(consultationsRef, where("expertId", "==", user.uid), where("status", "==", "active"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setActiveConsultations(snapshot.size)
        },
        (error) => {
          console.error("Error fetching consultations:", error)
        },
      )

      return () => unsubscribe()
    }
  }

  useEffect(() => {
    console.log("Fetching data...")
    console.log(profileData)
    const auth = getAuth()
    const user = auth.currentUser

    if (user) {
      fetchData()
      getExpertConsultationCount()

      // Fetch consultations from the consultations collection
      const consultationsRef = collection(db, "consultations")
      const q = query(consultationsRef, where("expertId", "==", user.uid), orderBy("lastUpdated", "desc"), limit(10))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const consultations: Consultation[] = []
          snapshot.forEach((doc) => {
            consultations.push({ id: doc.id, ...doc.data() } as Consultation)
          })
          setRecentConsultations(consultations)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching consultations:", error)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    }
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([reloadUser(), fetchData(), getExpertConsultationCount()])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [reloadUser, fetchData])

  const handleReload = () => {
    reloadUser()
    fetchData()
    getExpertConsultationCount()
  }

  const handleOpenConsultation = (consultation: Consultation) => {
    router.push({
      pathname: "/expert/ChatScreen",
      params: {
        farmerId: consultation.farmerId,
        farmerName: consultation.farmerName || "Farmer",
        consultationId: consultation.id,
      },
    })
  }

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>{t("reload")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const formatTime = (timestamp: Timestamp): string => {
    if (!timestamp) return ""
    const date = timestamp.toDate()
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 24) {
      return hours === 0 ? t("justNow") : `${hours} ${t("hoursAgo")}`
    }
    return date.toLocaleDateString()
  }

  return (


    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}    
          onRefresh={onRefresh}
          colors={["#4CAF50"]}
          tintColor="#4CAF50"
          title={t("pullToRefresh")}
          titleColor="#4CAF50"
        />
      }
    >
      <View style={styles.header}>
        <View style={[styles.greetingContainer, isRTL && styles.greetingContainerRTL]}>
          <Text style={[styles.greeting, isRTL && styles.urduText]}>{t("welcomeExpert")}</Text>
          <Text style={[styles.subGreeting, isRTL && styles.urduText]}>
            {t(profileData.specialization || "Expert")}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#4CAF50" />
            {loading ? (
              <ActivityIndicator size="small" color="#4CAF50" style={styles.statLoader} />
            ) : (
              <Text style={styles.statNumber}>{stats.completedConsultations}</Text>
            )}
            <Text style={styles.statLabel}>{t("completedConsultations")}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="message-processing-outline" size={24} color="#4CAF50" />
          {loading ? (
            <ActivityIndicator size="small" color="#4CAF50" style={styles.statLoader} />
          ) : (
            <Text style={styles.statNumber}>{activeConsultations}</Text>
          )}
          <Text style={styles.statLabel}>{t("activeConsultations")}</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star-outline" size={24} color="#4CAF50" />
          {loading ? (
            <ActivityIndicator size="small" color="#4CAF50" style={styles.statLoader} />
          ) : (
            <Text style={styles.statNumber}>{stats.rating.toFixed(1)}</Text>
          )}
          <Text style={styles.statLabel}>{t("rating")}</Text>
        </View>
      </View>

      <View style={styles.consultationsContainer}>
        <Text style={[styles.sectionTitle, isRTL && styles.urduText]}>{t("recentConsultations")}</Text>
        {loading ? (
          <View style={styles.consultationsLoaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>{t("Loading consultations...")}</Text>
          </View>
        ) : recentConsultations.length === 0 ? (
          <View style={styles.noConsultationsContainer}>
            <MaterialCommunityIcons name="message-text-outline" size={48} color="#4CAF50" />
            <Text style={[styles.noConsultationsText, isRTL && styles.urduText]}>{t("noConsultationsYet")}</Text>
          </View>
        ) : (
          recentConsultations.map((consultation) => (
            <TouchableOpacity
              key={consultation.id}
              style={styles.consultationCard}
              onPress={() => handleOpenConsultation(consultation)}
            >
              <View style={[styles.consultationHeader, isRTL && styles.consultationHeaderRTL]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={24}
                  color="#4CAF50"
                  style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
                />
                <Text style={[styles.farmerName, isRTL && styles.urduText]}>{consultation.farmerName}</Text>
                <Text style={styles.consultationTime}>{formatTime(consultation.lastUpdated)}</Text>
              </View>

              <Text style={[styles.consultationTopic, isRTL && styles.urduText]}>
                {consultation.topic || t("generalConsultation")}
              </Text>

              {consultation.lastMessage && (
                <Text style={[styles.lastMessage, isRTL && styles.urduText]} numberOfLines={1} ellipsizeMode="tail">
                  {consultation.lastMessage}
                </Text>
              )}

              <View style={styles.consultationFooter}>
                <Text
                  style={[
                    styles.statusBadge,
                    consultation.status === "active" ? styles.activeBadge : styles.completedBadge,
                  ]}
                >
                  {consultation.status === "active" ? t("active") : t("completed")}
                </Text>

                {(consultation.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{consultation.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
    
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  reloadButton: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  header: {
    marginBottom: 24,
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingContainerRTL: {
    alignItems: "flex-end",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFC107",
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 18,
    color: "#E8F5E9",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 12,
    alignItems: "center",
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },
  consultationsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  consultationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  consultationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  consultationHeaderRTL: {
    flexDirection: "row-reverse",
  },
  farmerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
    flex: 1,
  },
  consultationTime: {
    fontSize: 12,
    color: "#666666",
  },
  consultationTopic: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4CAF50",
    marginBottom: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  consultationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "500",
    overflow: "hidden",
  },
  activeBadge: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  completedBadge: {
    backgroundColor: "#E0E0E0",
    color: "#757575",
  },
  unreadBadge: {
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
  noConsultationsContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
  },
  noConsultationsText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  urduText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  statLoader: {
    marginTop: 8,
    marginBottom: 8,
  },
  consultationsLoaderContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
})

export default MenuTab
