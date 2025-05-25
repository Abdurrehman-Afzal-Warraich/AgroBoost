"use client"

import { useState, useCallback } from "react"
import { SERVER_URL } from "../utils/constants"
import * as ImagePicker from "expo-image-picker"

export const useProfileImage = (userId: string, userType: string) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const getProfileImage = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${SERVER_URL}/profile/${userId}`)
      const result = await response.json()

      if (result.success) {
        setImageUrl(result.data.imageUrl)
      }
      setError(null)
    } catch (err) {
      setError("Error fetching profile image")
      console.error("Error fetching profile image:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])
  const uploadImage = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        setError("Permission to access media library is required!")
        return
      } // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled) {
        setLoading(true)
        // Handle the file name and type
        const filename = result.assets[0].uri.split("/").pop()
        const fileType = "image/jpeg"

        // Create form data with the correct structure
        const formData = new FormData()
        formData.append("image", {
          uri: result.assets[0].uri,
          type: fileType,
          name: filename || "photo.jpg",
        } as any)
        formData.append("userId", userId)
        formData.append("userType", userType)

        console.log("Sending form data:", { filename, fileType, userId, userType })

        const response = await fetch(`${SERVER_URL}/api/profile/upload`, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        })

        console.log("Upload response status:", response.status)
        const data = await response.json()
        console.log("Upload response:", data)
        if (data.success) {
          setImageUrl(data.data.imageUrl)
          setError(null)
        } else {
          throw new Error(data.message)
        }
      }
    } catch (err) {
      setError("Error uploading image")
      console.error("Error uploading image:", err)
    } finally {
      setLoading(false)
    }
  }, [userId, userType])

  return {
    imageUrl,
    loading,
    error,
    uploadImage,
    getProfileImage,
  }
}
