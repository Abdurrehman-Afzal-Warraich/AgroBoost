import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, Alert, Text, ActivityIndicator } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { useFarmer } from '../hooks/fetch_farmer';

interface HelpTicket {
  name: string;
  email: string;
  userId: string;
  userType: 'farmer' | 'buyer' | 'expert';
  issueType: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  updatedAt: any;
}

const Help = () => {
  const { t } = useTranslation();
  const auth = getAuth();
  const { farmerData } = useFarmer();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Issue types for farmers
  const issueTypes = [
    { label: t('Select Issue Type'), value: '' },
    { label: t('Coins Related Issue'), value: 'coins' },
    { label: t('Expert Consultation Issue'), value: 'expert' },
    { label: t('Auction Related Issue'), value: 'auction' },
    { label: t('Buyer Related Issue'), value: 'buyer' },
    { label: t('Crop Prediction Issue'), value: 'prediction' },
    { label: t('Agriculture Scheme Issue'), value: 'agriculture_scheme' },
    { label: t('Agribot Issue'), value: 'agribot' },
    { label: t('Other'), value: 'other' },
  ];

  // Auto-populate user data when component mounts
  React.useEffect(() => {
    if (farmerData) {
      setName(farmerData.name || '');
      setEmail(farmerData.email || '');
    }
  }, [farmerData]);

  const getPriorityFromIssueType = (type: string): 'low' | 'medium' | 'high' => {
    const highPriorityIssues = ['coins', 'expert'];
    const mediumPriorityIssues = ['auction', 'agribot', 'prediction'];
    
    if (highPriorityIssues.includes(type)) return 'high';
    if (mediumPriorityIssues.includes(type)) return 'medium';
    return 'low';
  };

  const submitHelpTicket = async (ticketData: Omit<HelpTicket, 'createdAt' | 'updatedAt'>) => {
    try {
      const helpTicketsRef = collection(db, 'helpTickets');
      
      const docRef = await addDoc(helpTicketsRef, {
        ...ticketData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Help ticket submitted with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting help ticket:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!name.trim() || !email.trim() || !issueType || !message.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to submit a help ticket');
        return;
      }

      setLoading(true);

      const ticketData: Omit<HelpTicket, 'createdAt' | 'updatedAt' | 'subject'> = {
        name: name.trim(),
        email: email.trim(),
        userId: auth.currentUser.uid,
        userType: 'farmer',
        issueType,
        message: message.trim(),
        status: 'open',
        priority: getPriorityFromIssueType(issueType),
      };

      const ticketId = await submitHelpTicket(ticketData as any);

      Alert.alert(
        t('Success'),
        t('Your help ticket has been submitted successfully. Admin will contact you through email.'),
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setName(farmerData?.name || '');
              setEmail(farmerData?.email || '');
              setIssueType('');
              setMessage('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting help ticket:', error);
      Alert.alert('Error', 'Failed to submit help ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <View style={styles.headerContainer}>
            <Icon
              name="help-outline"
              type="material"
              color="#61B15A"
              size={30}
              style={styles.headerIcon}
            />
            <Text style={styles.headerText}>
              Need Help? Contact Us
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Issue Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={issueType}
                onValueChange={setIssueType}
                style={styles.picker}
              >
                {issueTypes.map((type) => (
                  <Picker.Item 
                    key={type.value} 
                    label={type.label} 
                    value={type.value} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please describe your issue in detail..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {issueType && (
            <View style={styles.priorityIndicator}>
              <Icon 
                name="flag" 
                type="material" 
                color={
                  getPriorityFromIssueType(issueType) === 'high' ? '#F44336' :
                  getPriorityFromIssueType(issueType) === 'medium' ? '#FF9800' : '#4CAF50'
                }
                size={16}
              />
              <Text style={styles.priorityText}>
                Priority: {getPriorityFromIssueType(issueType)}
              </Text>
            </View>
          )}

          <Button
            title={loading ? 'Submitting...' : 'Submit Help Ticket'}
            onPress={handleSubmit}
            buttonStyle={[styles.submitButton, loading && styles.disabledButton]}
            titleStyle={styles.submitButtonText}
            disabled={loading}
            icon={
              loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Icon name="send" type="material" color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              )
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 15,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  picker: {
    height: 55,
    width: '100%',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  priorityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#61B15A',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
});

export default Help;