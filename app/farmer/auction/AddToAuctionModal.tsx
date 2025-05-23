import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YieldPredictionData } from '../YieldPrediction/types';

interface AddToAuctionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAccept: () => void;
  predictionData: YieldPredictionData;
  t: (key: string) => string;
}

const AddToAuctionModal: React.FC<AddToAuctionModalProps> = ({
  isVisible,
  onClose,
  onAccept,
  predictionData,
  t,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.headerContainer}>
            <MaterialCommunityIcons name="store" size={24} color="#3A8A41" />
            <Text style={styles.modalTitle}>{t("Add to Auction")}</Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.description}>
              {t("Would you like to add your yield prediction to the auction?")}
            </Text>
            
            <View style={styles.detailsContainer}>
              <Text style={styles.detailLabel}>{t("Predicted Yield")}:</Text>
              <Text style={styles.detailValue}>
                {predictionData.predictedYield} {t("maunds")}
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.description}>
              {t("You can add 50% at maximum of the predicted yield to the auction.")}
            </Text>
              <Text style={styles.detailValue}>
                {predictionData.predictedYield} {t("maunds")}
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.detailLabel}>{t("Field Size")}:</Text>
              <Text style={styles.detailValue}>
                {predictionData.fieldSize} {t("acres")}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>{t("Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={[styles.buttonText, styles.acceptButtonText]}>
                {t("Accept")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};



const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  contentContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A8A41',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  acceptButton: {
    backgroundColor: '#3A8A41',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptButtonText: {
    color: 'white',
  },
});

export default AddToAuctionModal; 