import type React from "react"
import { StyleSheet, View } from "react-native"
import MapView, { Marker } from "react-native-maps"
import type { FieldData } from "../../hooks/useFields"

interface MapSectionProps {
  wheatField: FieldData
}

const MapSection: React.FC<MapSectionProps> = ({ wheatField }) => {
  return (
    <View style={[styles.mapContainer, styles.cardShadow]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: wheatField?.latitude || 31.5204,
          longitude: wheatField?.longitude || 74.3587,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {wheatField && (
          <Marker
            coordinate={{
              latitude: wheatField.latitude || 31.5204,
              longitude: wheatField.longitude || 74.3587,
            }}
            title={`Wheat Field`}
            description={`${wheatField.areaInAcres} acres`}
            pinColor="#3A8A41"
          />
        )}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
})

export default MapSection
