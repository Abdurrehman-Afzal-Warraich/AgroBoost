"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, TouchableOpacity, Image, StyleSheet, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker"
import { useTranslation } from "react-i18next"
import { SERVER_URL } from "../utils/constants"

interface ProfilePictureProps {
  imageUrl?: string
  size?: number
  userId: string
  userType: "farmer" | "expert" | "buyer"
  onImageUpdated?: (url: string) => void
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  imageUrl: propImageUrl, 
  size = 120, 
  userId, 
  userType, 
  onImageUpdated 
}) => {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(propImageUrl)

  // Fetch profile image when component mounts or userId changes
  useEffect(() => {
    if (userId && !propImageUrl) {
      getProfileImage()
    } 
    
  }, [userId, propImageUrl])

  // Update local state when prop changes
  useEffect(() => {
    if (propImageUrl) setCurrentImageUrl(propImageUrl)
  }, [propImageUrl])

  // Utility to fix localhost URLs for mobile devices
  const fixLocalhostUrl = (url: string) => {
    if (url.startsWith('http://localhost')) {
      return url.replace('http://localhost', 'http://192.168.18.72');
    }
    return url;
  };

  const getProfileImage = async () => {
    try {
      setLoading(true)
      console.log("Fetching profile image for userId:", userId)
      const response = await fetch(`${SERVER_URL}/api/profile/${userId}`)
      const result = await response.json()
      console.log("Profile image fetch response:", result)
      if (result.success && result.data?.imageUrl) {
        // Ensure absolute URL
        const imageUrl = fixLocalhostUrl(result.data.imageUrl)
        setCurrentImageUrl(imageUrl)
        if (onImageUpdated) {
          onImageUpdated(imageUrl)
        }
      } else {
        console.log("No profile image found or fetch failed")
      }
    } catch (error) {
      console.error("Error fetching profile image:", error)
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t("Permission Required"), t("Please allow access to your photo library"))
        return
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert(t("Error"), t("Failed to pick image"))
    }
  }

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true)

      // Create form data
      const filename = uri.split("/").pop()
      const formData = new FormData()
      formData.append("image", {
        uri: uri,
        type: "image/jpeg",
        name: filename || "profile.jpg",
      } as any)
      formData.append("userId", userId)
      formData.append("userType", userType)

      console.log("Uploading to URL:", `${SERVER_URL}/api/profile/upload`)
      console.log("Form data:", {
        uri,
        userId,
        userType,
        filename,
      })

      // Send to backend
      const response = await fetch(`${SERVER_URL}/api/profile/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      if (!response.ok) {
        console.error("Upload failed with status:", response.status)
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("Upload response:", data)
      if (data.success && data.data.imageUrl) {
        const imageUrl = fixLocalhostUrl(data.data.imageUrl)
        setCurrentImageUrl(imageUrl)
        if (onImageUpdated) {
          onImageUpdated(imageUrl)
        }
      } else {
        throw new Error(data.message || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert(t("Error"), t("Failed to upload image"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {currentImageUrl ? (
        <Image 
          source={{ uri: currentImageUrl }} 
          style={[styles.image, { width: size, height: size }]} 
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          {loading ? (
            <MaterialCommunityIcons name="loading" size={size * 0.6} color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="account" size={size * 0.6} color="#FFFFFF" />
          )}
        </View>
      )}
      <TouchableOpacity 
        style={[styles.uploadButton, { right: 0, bottom: 0 }]} 
        onPress={pickImage} 
        disabled={uploading || loading}
      >
        <MaterialCommunityIcons 
          name={uploading ? "loading" : "plus-circle"} 
          size={32} 
          color="#4CAF50" 
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  placeholder: {
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  uploadButton: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 2,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})

export default ProfilePicture