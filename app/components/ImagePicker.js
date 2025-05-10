"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePickerExpo from "expo-image-picker"
import { useState } from "react"
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const ImagePicker = ({ onImageSelected, onCancel }) => {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    try {
      setLoading(true)

      if (Platform.OS === "web") {
        // Create an input element for file selection
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"

        // Create a promise to handle file selection
        const fileSelected = new Promise((resolve) => {
          input.onchange = (e) => {
            const file = e.target.files[0]
            resolve(file)
          }
        })

        // Trigger file selection dialog
        input.click()

        // Wait for file selection
        const file = await fileSelected

        if (file) {
          const imageUri = URL.createObjectURL(file)
          console.log("Selected web image:", {
            uri: imageUri,
            type: file.type,
            name: file.name,
            size: file.size,
          })

          setImage(imageUri)
          onImageSelected({
            uri: imageUri,
            file: file,
            type: file.type,
            name: file.name,
          })
        }
      } else {
        // Mobile platform code
        const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please grant camera roll permissions to select images.")
          setLoading(false)
          return
        }

        const result = await ImagePickerExpo.launchImageLibraryAsync({
          mediaTypes: ImagePickerExpo.MediaTypeOptions ? ImagePickerExpo.MediaTypeOptions.Images : ImagePickerExpo.MediaType.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedImage = result.assets[0]
          console.log("Selected mobile image:", {
            uri: selectedImage.uri,
            type: selectedImage.type || "image/jpeg",
            width: selectedImage.width,
            height: selectedImage.height,
          })

          const fileName = selectedImage.uri.split("/").pop() || `image-${Date.now()}.jpg`

          setImage(selectedImage.uri)
          onImageSelected({
            uri: selectedImage.uri,
            type: "image/jpeg", // Force image/jpeg for mobile uploads
            name: fileName,
          })
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Error picking image:", error)
      setLoading(false)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const handleCancel = () => {
    if (image && Platform.OS === "web") {
      URL.revokeObjectURL(image)
    }
    setImage(null)
    onCancel()
  }

  const handleConfirm = () => {
    if (!image) return

    // When confirming, pass the confirmed flag along with the image data
    onImageSelected({
      uri: image,
      confirmed: true,
      // Keep any previously selected file data
      file: image.file,
      type: "image/jpeg", // Force image/jpeg type
      name: image.name || `image-${Date.now()}.jpg`,
    })
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      ) : image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Ionicons name="close-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton} onPress={handleConfirm}>
              <Ionicons name="send" size={24} color="white" />
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#4CAF50" />
          <Text style={styles.pickerText}>Select Image</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  previewContainer: {
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickerText: {
    color: "#4CAF50",
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default ImagePicker