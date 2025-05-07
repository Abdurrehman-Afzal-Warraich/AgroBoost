import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'custom';
  color?: string;
  onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  visible, 
  message, 
  type = 'error',
  color,
  onHide 
}) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Reset opacity to 0 before starting new animation
      opacity.setValue(0);
      
      Animated.sequence([
        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Stay visible longer (3 seconds)
        Animated.delay(4000),
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) {
          onHide();
        }
      });
    }
  }, [visible, message]); // Added message as dependency to restart animation when message changes

  if (!visible) return null;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
        return 'information';
      case 'custom':
        return 'information';
      default:
        return 'alert-circle';
    }
  };

  const getBackgroundColor = () => {
    if (color) return color;
    
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#FF5252';
      case 'info':
        return '#2196F3';
      default:
        return '#FF5252';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity,
          backgroundColor: getBackgroundColor(),
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }
      ]}
    >
      <MaterialCommunityIcons 
        name={getIconName()} 
        size={24} 
        color="#FFFFFF" 
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  message: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
}); 

export default Toast;