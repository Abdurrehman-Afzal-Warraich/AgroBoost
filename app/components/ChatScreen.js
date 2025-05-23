"use client"

import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import AudioRecorder from "../components/AudioRecorder"
import ChatBubble from "../components/ChatBubble"
import ConnectionStatus from "../components/ConnectionStatus"
import EmptyChat from "../components/EmptyChat"
import ImagePicker from "../components/ImagePicker"
import TypingIndicator from "../components/TypingIndicator"
import { SERVER_URL } from "../utils/constants"
import { emitStopTyping, emitTyping, socket } from "../utils/socket"
import { faR } from "@fortawesome/free-solid-svg-icons"

// Define fallback functions in case the imported ones are undefined
const safeEmitTyping = (data) => {
  try {
    if (typeof emitTyping === "function") {
      emitTyping(data)
    } else {
      socket.emit("typing", data)
    }
  } catch (error) {
    console.error("Error emitting typing event:", error)
  }
}

const safeEmitStopTyping = (data) => {
  try {
    if (typeof emitStopTyping === "function") {
      emitStopTyping(data)
    } else {
      socket.emit("stopTyping", data)
    }
  } catch (error) {
    console.error("Error emitting stopTyping event:", error)
  }
}

const ChatScreenComponent = ({ currentUserId, otherUserId, userType }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const flatListRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isMounted = useRef(true)


const farmerName  = "DAWOOD"
const expertName  = "Muhammad noman"

console.log("Farmer Name: ", farmerName)
console.log("Farmer Name: ", expertName)
  // Get user names based on user type
  const currentUserName = userType === "farmer" ? farmerName : expertName
  const otherUserName = userType === "farmer" ? expertName : farmerName




  console.log("Current User Name:", currentUserName)
  console.log("Other User Name:", otherUserName)



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!isMounted.current) return

        setLoading(true)
        setError(null)

        console.log(`Fetching messages between ${currentUserId} and ${otherUserId}`)

        // Check if IDs are valid
        if (!currentUserId || !otherUserId) {
          throw new Error("Invalid user IDs")
        }

        const response = await fetch(`${SERVER_URL}/api/messages/${currentUserId}/${otherUserId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error response:", errorData)
          throw new Error(`Failed to fetch messages: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Fetched ${data.length} messages`)

        if (isMounted.current) {
          setMessages(data)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
        if (isMounted.current) {
          setError("Failed to load messages. Please try again.")
          setLoading(false)
        }
      }
    }

    if (currentUserId && otherUserId) {
      fetchMessages()
    } else {
      setLoading(false)
      setError("Invalid user IDs. Please go back and try again.")
    }
  }, [currentUserId, otherUserId])

  // Add memoized callbacks
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true })
        }
      }, 100)
    }
  }, [])

  const handleReceiveMessage = useCallback(
    (data) => {
      if (data.senderId === otherUserId) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            senderId: data.senderId,
            receiverId: currentUserId,
            messageType: data.messageType || "text",
            content: data.message,
            timestamp: new Date(),
            _id: Date.now().toString(),
          },
        ])
        setIsOtherUserTyping(false)
      }
    },
    [currentUserId, otherUserId],
  )

  const handleUserTyping = useCallback(
    (data) => {
      if (data.senderId === otherUserId && data.receiverId === currentUserId) {
        setIsOtherUserTyping(true)
      }
    },
    [currentUserId, otherUserId],
  )

  const handleUserStoppedTyping = useCallback(
    (data) => {
      if (data.senderId === otherUserId && data.receiverId === currentUserId) {
        setIsOtherUserTyping(false)
      }
    },
    [currentUserId, otherUserId],
  )

  // Socket connection effect with memoized handlers
  useEffect(() => {
    if (!currentUserId || !socket) return

    // Join the chat only once when component mounts
    socket.emit("join", currentUserId)

    socket.on("receiveMessage", handleReceiveMessage)
    socket.on("userTyping", handleUserTyping)
    socket.on("userStoppedTyping", handleUserStoppedTyping)

    return () => {
      socket.off("receiveMessage", handleReceiveMessage)
      socket.off("userTyping", handleUserTyping)
      socket.off("userStoppedTyping", handleUserStoppedTyping)
    }
  }, [currentUserId, handleReceiveMessage, handleUserTyping, handleUserStoppedTyping])

  // Scroll effect with memoized callback
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      safeEmitTyping({
        senderId: currentUserId,
        receiverId: otherUserId,
      })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      safeEmitStopTyping({
        senderId: currentUserId,
        receiverId: otherUserId,
      })
    }, 2000)
  }

  const sendTextMessage = async () => {
    if (inputMessage.trim() === "") return

    // Clear typing timeout and indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    safeEmitStopTyping({
      senderId: currentUserId,
      receiverId: otherUserId,
    })

    // Create new message object
    const newMessage = {
      senderId: currentUserId,
      receiverId: otherUserId,
      messageType: "text",
      content: inputMessage,
    }

    // Add to local state immediately with a temporary ID
    const tempId = Date.now().toString()
    const messageWithTempId = { ...newMessage, _id: tempId, pending: true, timestamp: new Date() }
    setMessages((prevMessages) => [...prevMessages, messageWithTempId])

    // Clear input
    setInputMessage("")

    // Send to server
    try {
      const response = await fetch(`${SERVER_URL}/api/messages/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const savedMessage = await response.json()

      // Update the message in state with the server-generated ID
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...savedMessage, pending: false } : msg)),
      )

      // Emit socket event
      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: inputMessage,
        messageType: "text",
      })
    } catch (error) {
      console.error("Error sending message:", error)

      // Mark message as failed
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...msg, failed: true, pending: false } : msg)),
      )

      Alert.alert("Error", "Failed to send message. Tap to retry.")
    }
  }

  const sendImageMessage = async (imageData) => {
    if (!imageData || !imageData.uri) {
      setShowImagePicker(false)
      return
    }

    console.log("Sending image data:", {
      uri: imageData.uri,
      type: imageData.type,
      name: imageData.name,
      fileSize: imageData.file?.size,
    })

    // Create a temporary message for UI feedback
    const tempId = Date.now().toString()
    const tempMessage = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: otherUserId,
      messageType: "image",
      content: imageData.uri,
      timestamp: new Date(),
      pending: true,
    }

    // Add to local state
    setMessages((prevMessages) => [...prevMessages, tempMessage])

    // Hide image picker
    setShowImagePicker(false)

    try {
      // Create form data for file upload
      const formData = new FormData()

      if (Platform.OS === "web" && imageData.file) {
        // For web, use the actual File object
        console.log("Appending web file:", {
          name: imageData.file.name,
          type: imageData.file.type,
          size: imageData.file.size,
        })
        formData.append("file", imageData.file)
      } else {
        // For mobile platforms
        const fileUri = imageData.uri

        console.log("Appending mobile file:", {
          uri: fileUri,
          type: imageData.type,
          name: imageData.name,
        })

        // Create a file object for the image
        formData.append("file", {
          uri: fileUri,
          type: imageData.type || "image/jpeg",
          name: imageData.name || `image-${Date.now()}.jpg`,
        })
      }

      // Add other required data
      formData.append("senderId", currentUserId)
      formData.append("receiverId", otherUserId)
      formData.append("messageType", "image")

      console.log("Sending form data to:", `${SERVER_URL}/api/messages/media`)

      // Send to server
      const response = await fetch(`${SERVER_URL}/api/messages/media`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Failed to send image: ${response.status}`)
      }

      const savedMessage = await response.json()
      console.log("Saved message:", savedMessage)

      // Update message in state
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...savedMessage, pending: false } : msg)),
      )

      // Notify other user via socket
      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: savedMessage.content,
        messageType: "image",
      })

      // Clean up object URL if it was created (web platform)
      if (Platform.OS === "web" && imageData.uri.startsWith("blob:")) {
        URL.revokeObjectURL(imageData.uri)
      }
    } catch (error) {
      console.error("Error sending image:", error)

      // Mark message as failed
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...msg, failed: true, pending: false } : msg)),
      )

      Alert.alert("Error", "Failed to send image. Please try again.")
    }
  }

  const sendAudioMessage = async (audioData) => {
    if (!audioData || !audioData.uri) {
      setShowAudioRecorder(false)
      return
    }

    console.log("Sending audio data:", audioData)

    // Create a temporary message for UI feedback
    const tempId = Date.now().toString()
    const tempMessage = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: otherUserId,
      messageType: "audio",
      content: audioData.uri,
      timestamp: new Date(),
      pending: true,
    }

    // Add to local state
    setMessages((prevMessages) => [...prevMessages, tempMessage])

    // Hide audio recorder
    setShowAudioRecorder(false)

    try {
      // Create form data for file upload
      const formData = new FormData()

      if (Platform.OS === "web" && audioData.file) {
        // For web, use the File object directly
        formData.append("file", audioData.file)
      } else {
        // For mobile platforms
        const fileUri = Platform.OS === "android" ? audioData.uri : audioData.uri.replace("file://", "")

        formData.append("file", {
          uri: fileUri,
          type: audioData.type || "audio/m4a",
          name: "audio.m4a",
        })
      }

      // Add other data
      formData.append("senderId", currentUserId)
      formData.append("receiverId", otherUserId)
      formData.append("messageType", "audio")

      console.log("Sending form data:", {
        senderId: currentUserId,
        receiverId: otherUserId,
        messageType: "audio",
        fileInfo:
          Platform.OS === "web"
            ? {
                type: audioData.file?.type,
                size: audioData.file?.size,
              }
            : {
                uri: audioData.uri,
                type: audioData.type,
              },
      })

      // Send to server
      const response = await fetch(`${SERVER_URL}/api/messages/media`, {
        method: "POST",
        body: formData,
        headers:
          Platform.OS === "web"
            ? undefined
            : {
                "Content-Type": "multipart/form-data",
              },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Failed to send audio: ${response.status}`)
      }

      const savedMessage = await response.json()
      console.log("Saved message:", savedMessage)

      // Update message in state
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...savedMessage, pending: false } : msg)),
      )

      // Notify other user via socket
      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: savedMessage.content,
        messageType: "audio",
      })
    } catch (error) {
      console.error("Error sending audio:", error)

      // Mark message as failed
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === tempId ? { ...msg, failed: true, pending: false } : msg)),
      )

      Alert.alert("Error", "Failed to send audio. Please try again.")
    }
  }

  const retryMessage = (failedMessage) => {
    // Remove the failed message
    setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== failedMessage._id))

    // Retry based on message type
    if (failedMessage.messageType === "text") {
      setInputMessage(failedMessage.content)
    } else if (failedMessage.messageType === "image") {
      Alert.alert("Retry", "Please select the image again.")
      setShowImagePicker(true)
    } else if (failedMessage.messageType === "audio") {
      Alert.alert("Retry", "Please record the audio again.")
      setShowAudioRecorder(true)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    )
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {otherUserName} {userType === "farmer" ? "(Expert)" : "(Farmer)"}
          </Text>
          <Text style={styles.headerSubtitle}>You: {currentUserName}</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>
      <ConnectionStatus />

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => item.failed && retryMessage(item)} disabled={!item.failed}>
            <View style={item.failed ? styles.failedMessageContainer : null}>
              {item.failed && (
                <View style={styles.retryBadge}>
                  <Text style={styles.retryBadgeText}>Tap to retry</Text>
                </View>
              )}
              <ChatBubble message={item} isCurrentUser={item.senderId === currentUserId} />
              {item.pending && <Text style={styles.pendingText}>Sending...</Text>}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyMessageList]}
        ListEmptyComponent={<EmptyChat userType={userType} />}
      />

      {isOtherUserTyping && <TypingIndicator />}

      {/* Media Pickers */}
      {showImagePicker && <ImagePicker onImageSelected={sendImageMessage} onCancel={() => setShowImagePicker(false)} />}

      {showAudioRecorder && (
        <AudioRecorder onAudioRecorded={sendAudioMessage} onCancel={() => setShowAudioRecorder(false)} />
      )}

      {/* Input Area - Always visible */}
      {!showImagePicker && !showAudioRecorder && (
        <View style={styles.inputContainer}>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => {
                setShowImagePicker(true)
                setShowAudioRecorder(false)
              }}
            >
              <Ionicons name="image" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => {
                setShowAudioRecorder(true)
                setShowImagePicker(false)
              }}
            >
              <Ionicons name="mic" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={(text) => {
              setInputMessage(text)
              handleTyping()
            }}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, inputMessage.trim() === "" ? styles.sendButtonDisabled : null]}
            onPress={sendTextMessage}
            disabled={inputMessage.trim() === ""}
          >
            <Ionicons name="send" size={24} color={inputMessage.trim() === "" ? "#CCCCCC" : "white"} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  statusText: {
    color: "white",
    fontSize: 14,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyMessageList: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  mediaButtons: {
    flexDirection: "row",
    marginRight: 8,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  pendingText: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginRight: 10,
    marginTop: 2,
  },
  failedMessageContainer: {
    position: "relative",
  },
  retryBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: "#F44336",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  retryBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
})

export default ChatScreenComponent
