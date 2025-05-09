"use client"

import { useCallback, useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { socket } from "../utils/socket"

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(socket?.connected || false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const onConnect = useCallback(() => {
    setIsConnected(true)
    setReconnectAttempt(0)
  }, [])

  const onDisconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const onReconnectAttempt = useCallback((attempt) => {
    setReconnectAttempt(attempt)
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("reconnect_attempt", onReconnectAttempt)

    // Set initial connection state
    setIsConnected(socket.connected)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("reconnect_attempt", onReconnectAttempt)
    }
  }, [onConnect, onDisconnect, onReconnectAttempt])

  if (isConnected) return null

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {reconnectAttempt > 0 ? `Reconnecting... (Attempt ${reconnectAttempt})` : "Connection lost. Reconnecting..."}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F44336",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
})

export default ConnectionStatus
