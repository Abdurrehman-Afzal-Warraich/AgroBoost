"use client"

import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SERVER_URL } from "../utils/constants"

const ChatBubble = ({ message, isCurrentUser }) => {
  const { messageType, content, timestamp } = message
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isMounted = useRef(true)

  // Format timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const playAudio = useCallback(async (audioUri) => {
    try {
      setIsLoading(true)

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync()
      }

      // Construct the full audio URL
      const fullAudioUrl = audioUri.startsWith('http') 
        ? audioUri 
        : `${SERVER_URL}/${audioUri.replace(/\\/g, '/')}`;

      console.log("Loading audio from:", fullAudioUrl)

      // Request audio permission first
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Audio permission not granted');
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fullAudioUrl },
        { shouldPlay: true },
        (status) => {
        if (status.didJustFinish) {
          setIsPlaying(false)
          }
        }
      )

      if (isMounted.current) {
        setSound(newSound)
        setIsPlaying(true)
        setIsLoading(false)
      } else {
        // If component unmounted during async operation, clean up
        newSound.unloadAsync()
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      if (isMounted.current) {
        setIsLoading(false)
        Alert.alert("Error", "Failed to play audio message")
      }
    }
  }, [sound])

  // Clean up sound when component unmounts or when sound changes
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync()
      setIsPlaying(false)
    }
  }

  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer]}>
      {messageType === "text" ? (
        <View style={[styles.textBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
            {content}
          </Text>
          <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
            {formattedTime}
          </Text>
        </View>
      ) : messageType === "image" ? (
        <View style={[styles.mediaBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          {imageError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={40} color={isCurrentUser ? "white" : "#666"} />
              <Text style={[styles.errorText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
                Failed to load image
              </Text>
            </View>
          ) : (
          <Image
            source={{
                uri: content.startsWith("http") ? content : `${SERVER_URL}/${content.replace(/\\/g, '/')}`,
            }}
            style={styles.image}
            resizeMode="cover"
              onError={() => setImageError(true)}
          />
          )}
          <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
            {formattedTime}
          </Text>
        </View>
      ) : messageType === "audio" ? (
        <View style={[styles.audioBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          <View style={styles.audioContent}>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={isPlaying ? pauseAudio : () => playAudio(content)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={24} color={isCurrentUser ? "white" : "#333"} />
              ) : isPlaying ? (
                <Ionicons name="pause" size={24} color={isCurrentUser ? "white" : "#333"} />
              ) : (
                <Ionicons name="play" size={24} color={isCurrentUser ? "white" : "#333"} />
              )}
            </TouchableOpacity>
            <View style={styles.audioInfo}>
              <Text style={[styles.audioText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
                Audio Message
              </Text>
              <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    maxWidth: "80%",
  },
  currentUserContainer: {
    alignSelf: "flex-end",
  },
  otherUserContainer: {
    alignSelf: "flex-start",
  },
  textBubble: {
    borderRadius: 18,
    padding: 12,
    minWidth: 80,
  },
  mediaBubble: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 150,
  },
  audioBubble: {
    borderRadius: 18,
    padding: 12,
    minWidth: 180,
  },
  currentUserBubble: {
    backgroundColor: "#4CAF50",
  },
  otherUserBubble: {
    backgroundColor: "#E0E0E0",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: "#333",
  },
  image: {
    width: 200,
    height: 200,
  },
  audioContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  currentUserTimestamp: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  otherUserTimestamp: {
    color: "rgba(0, 0, 0, 0.5)",
  },
  errorContainer: {
    width: 200,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
})

export default ChatBubble
