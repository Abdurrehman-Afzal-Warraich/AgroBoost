"use client"

import { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"

const TypingIndicator = () => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current
  const dot2Opacity = useRef(new Animated.Value(0.3)).current
  const dot3Opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        // Dot 1 animation
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Dot 2 animation
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Dot 3 animation
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Reset all dots
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        animateDots()
      })
    }

    animateDots()

    return () => {
      dot1Opacity.stopAnimation()
      dot2Opacity.stopAnimation()
      dot3Opacity.stopAnimation()
    }
  }, [dot1Opacity, dot2Opacity, dot3Opacity])

  return (
    <View style={styles.container}>
      <View style={styles.bubbleContainer}>
        <Text style={styles.typingText}>Typing</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubbleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    maxWidth: "60%",
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#666",
    marginHorizontal: 2,
  },
})

export default TypingIndicator
