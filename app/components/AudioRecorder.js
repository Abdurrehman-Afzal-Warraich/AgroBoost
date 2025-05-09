"use client"

import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import { useEffect, useRef, useState } from "react"
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const AudioRecorder = ({ onAudioRecorded, onCancel }) => {
  const [recording, setRecording] = useState(null)
  const [recordingStatus, setRecordingStatus] = useState("idle")
  const [audioUri, setAudioUri] = useState(null)
  const [duration, setDuration] = useState(0)
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const timer = useRef(null)
  const [loading, setLoading] = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const audioStream = useRef(null)
  const webAudioElement = useRef(null)

  useEffect(() => {
    // Clean up resources when component unmounts
    return () => {
      clearInterval(timer.current)

      // Clean up web audio resources
      if (Platform.OS === "web") {
        if (audioStream.current) {
          audioStream.current.getTracks().forEach((track) => track.stop())
          audioStream.current = null
        }
        if (mediaRecorder.current) {
          mediaRecorder.current = null
        }
        if (webAudioElement.current) {
          webAudioElement.current.pause()
          webAudioElement.current.src = ""
        }
        if (audioUri && audioUri.startsWith("blob:")) {
          URL.revokeObjectURL(audioUri)
        }
        audioChunks.current = []
      } else {
        // Mobile cleanup
        if (recording) {
          const currentRecording = recording
          setRecording(null)
          try {
            currentRecording.stopAndUnloadAsync()
          } catch (error) {
            console.log("Recording was already stopped or unloaded", error)
          }
        }
        if (sound) {
          const currentSound = sound
          setSound(null)
          try {
            currentSound.unloadAsync()
          } catch (error) {
            console.log("Sound was already unloaded", error)
          }
        }
      }
    }
  }, [recording, sound, audioUri])

  const startRecording = async () => {
    try {
      setLoading(true)
      console.log("Starting recording on platform:", Platform.OS)

      if (Platform.OS === "web") {
        try {
          console.log("Requesting microphone permission...")
          audioStream.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          console.log("Microphone permission granted")

          // Create MediaRecorder
          const options = { mimeType: "audio/webm;codecs=opus" }
          mediaRecorder.current = new MediaRecorder(audioStream.current, options)

          // Set up event handlers
          mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.current.push(event.data)
            }
          }

          mediaRecorder.current.onstop = () => {
            const blob = new Blob(audioChunks.current, { type: "audio/webm;codecs=opus" })
            const audioUrl = URL.createObjectURL(blob)
            setAudioUri(audioUrl)
            setRecordingStatus("stopped")

            // Create audio element for playback
            if (!webAudioElement.current) {
              webAudioElement.current = new Audio()
            }
          }

          // Start recording
          audioChunks.current = []
          mediaRecorder.current.start()
          setRecordingStatus("recording")
          setDuration(0)

          const startTime = Date.now()
          timer.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000)
            setDuration(elapsed)
          }, 1000)
        } catch (error) {
          console.error("Error accessing microphone:", error)
          Alert.alert("Error", "Failed to access microphone")
          setLoading(false)
          return
        }
      } else {
        console.log("Starting mobile recording...")
        const { status } = await Audio.requestPermissionsAsync()
        console.log("Permission status:", status)
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please grant microphone permissions to record audio.")
          setLoading(false)
          return
        }

        console.log("Setting audio mode...")
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          // Fix for invalid interruptionModeAndroid value
          interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })

        if (timer.current) {
          clearInterval(timer.current)
        }

        console.log("Creating recording...")
        const recordingOptions = {
          android: {
            extension: ".m4a",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: ".m4a",
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        }

        const newRecording = new Audio.Recording()
        try {
          await newRecording.prepareToRecordAsync(recordingOptions)
          await newRecording.startAsync()
          setRecording(newRecording)
          setRecordingStatus("recording")
          setDuration(0)

          const startTime = Date.now()
          timer.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000)
            setDuration(elapsed)
          }, 1000)
        } catch (error) {
          console.error("Error starting recording:", error)
          Alert.alert("Error", "Failed to start recording. Please try again.")
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Failed to start recording:", error)
      setLoading(false)
      Alert.alert("Error", "Failed to start recording. Please try again.")
    }
  }

  const stopRecording = async () => {
    console.log("Stopping recording on platform:", Platform.OS)
    if (Platform.OS === "web") {
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        console.log("Stopping web recording")
        mediaRecorder.current.stop()
        if (audioStream.current) {
          console.log("Stopping audio stream")
          audioStream.current.getTracks().forEach((track) => track.stop())
        }
        clearInterval(timer.current)
      }
    } else {
      if (!recording) {
        console.log("No active recording to stop")
        return
      }

      try {
        console.log("Stopping mobile recording")
        setRecordingStatus("stopping")
        clearInterval(timer.current)

        const currentRecording = recording
        setRecording(null)

        await currentRecording.stopAndUnloadAsync()
        console.log("Recording stopped")

        const uri = currentRecording.getURI()
        console.log("Recording URI:", uri)
        setAudioUri(uri)
        setRecordingStatus("stopped")

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          // Fix for invalid interruptionModeAndroid value
          interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        })
      } catch (error) {
        console.error("Failed to stop recording:", error)
        setRecordingStatus("idle")
      }
    }
  }

  const playSound = async () => {
    if (!audioUri) {
      console.log("No audio URI available")
      return
    }

    try {
      console.log("Playing sound on platform:", Platform.OS)
      console.log("Audio URI:", audioUri)

      if (Platform.OS === "web") {
        if (!webAudioElement.current) {
          console.log("Creating new audio element")
          webAudioElement.current = new Audio()
        }

        webAudioElement.current.src = audioUri
        console.log("Set audio source:", audioUri)

        webAudioElement.current.onended = () => {
          console.log("Playback ended")
          setIsPlaying(false)
        }
        webAudioElement.current.onpause = () => {
          console.log("Playback paused")
          setIsPlaying(false)
        }
        webAudioElement.current.onplay = () => {
          console.log("Playback started")
          setIsPlaying(true)
        }
        webAudioElement.current.onerror = (e) => {
          console.error("Audio playback error:", e)
          Alert.alert("Error", "Failed to play audio")
        }

        setSound(webAudioElement.current)
        setIsPlaying(true)
        try {
          await webAudioElement.current.play()
          console.log("Playback initiated")
        } catch (error) {
          console.error("Play failed:", error)
          Alert.alert("Error", "Failed to start playback")
        }
      } else {
        console.log("Creating sound object for mobile")
        if (sound) {
          console.log("Unloading previous sound")
          await sound.unloadAsync()
        }

        console.log("Loading new sound")
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true }, (status) => {
          console.log("Playback status:", status)
        })

        console.log("Sound created")
        setSound(newSound)

        newSound.setOnPlaybackStatusUpdate((status) => {
          console.log("Playback status update:", status)
          if (status.didJustFinish) {
            console.log("Playback finished")
            setIsPlaying(false)
          }
        })

        setIsPlaying(true)
        await newSound.playAsync()
        console.log("Playback started")
      }
    } catch (error) {
      console.error("Failed to play sound:", error)
      Alert.alert("Error", "Failed to play audio. Please try again.")
    }
  }

  const pauseSound = async () => {
    if (Platform.OS === "web") {
      // Web implementation
      if (sound) {
        sound.pause()
        setIsPlaying(false)
      }
    } else {
      // Mobile implementation (existing code)
      if (!sound) return

      try {
        setIsPlaying(false)
        await sound.pauseAsync()
      } catch (error) {
        console.error("Failed to pause sound", error)
      }
    }
  }

  const handleCancel = () => {
    if (sound) {
      try {
        sound.unloadAsync()
      } catch (error) {
        console.log("Sound was already unloaded", error)
      }
    }
    setAudioUri(null)
    setDuration(0)
    setRecordingStatus("idle")
    onCancel()
  }

  const handleSend = () => {
    console.log("Handling send on platform:", Platform.OS)
    if (Platform.OS === "web") {
      console.log("Preparing web audio for sending")
      fetch(audioUri)
        .then((res) => res.blob())
        .then((blob) => {
          console.log("Blob created:", blob.size, "bytes")
          const mimeType = mediaRecorder.current?.mimeType || "audio/webm;codecs=opus"
          const fileName = `recording-${Date.now()}.webm`
          const file = new File([blob], fileName, { type: mimeType })
          console.log("File created:", {
            name: file.name,
            type: file.type,
            size: file.size,
          })
          onAudioRecorded({
            uri: audioUri,
            file,
            duration,
            type: mimeType,
            name: fileName,
          })
        })
        .catch((error) => {
          console.error("Error converting blob to file:", error)
          Alert.alert("Error", "Failed to prepare audio for sending.")
        })
    } else {
      console.log("Sending mobile audio:", audioUri)
      // For Android, we need to ensure we're passing the correct file information
      onAudioRecorded({
        uri: audioUri,
        duration,
        type: "audio/m4a",
        name: `recording-${Date.now()}.m4a`,
      })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <View style={styles.container}>
      {recordingStatus === "idle" && (
        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
          <Ionicons name="mic" size={24} color="#4CAF50" />
          <Text style={styles.recordText}>Record Audio Message</Text>
        </TouchableOpacity>
      )}

      {recordingStatus === "recording" && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingInfo}>
            <Ionicons name="radio" size={24} color="#F44336" />
            <Text style={styles.recordingText}>Recording... {formatTime(duration)}</Text>
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Ionicons name="stop-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {recordingStatus === "stopped" && (
        <View style={styles.previewContainer}>
          <View style={styles.audioPreview}>
            <TouchableOpacity style={styles.playButton} onPress={isPlaying ? pauseSound : playSound}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.durationText}>{formatTime(duration)}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Ionicons name="close-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={24} color="white" />
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  // Styles remain the same
  container: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 10,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 12,
    borderRadius: 8,
  },
  recordText: {
    color: "#4CAF50",
    fontWeight: "bold",
    marginLeft: 8,
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFEBEE",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingText: {
    color: "#F44336",
    fontWeight: "bold",
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: "#F44336",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    alignItems: "center",
  },
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    width: "100%",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  durationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
})

export default AudioRecorder
