import { io } from "socket.io-client"
import { SERVER_URL } from "./constants"




// Create socket connection

export const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// Log socket connection status
socket.on("connect", () => {
  console.log("Socket connected:", socket.id)
})

socket.on("disconnect", () => {
  console.log("Socket disconnected")
})

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error)
  // Attempt to reconnect after a delay
  setTimeout(() => {
    socket.connect()
  }, 5000)
})

// Helper functions for socket events
export const emitTyping = (data) => {
  socket.emit("typing", data)
}

export const emitStopTyping = (data) => {
  socket.emit("stopTyping", data)
}

export const emitReadReceipt = (data) => {
  socket.emit("readReceipt", data)
}
