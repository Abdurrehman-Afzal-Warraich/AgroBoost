import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-elements';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface IssueCategory {
  key: string;
  title: string;
  icon: string;
  description: string;
}

const Help = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const router = useRouter();

  

  

  const handleExpertConsultation = () => {
    router.push('/farmer/ExpertConsultation');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Expert Consultation Section */}
        <View style={styles.expertAdviceContainer}>
          <MaterialCommunityIcons name="account-tie" size={40} color="#4CAF50" />
          <Text style={styles.expertAdviceTitle}>{t('Need More Help?')}</Text>
          <Text style={styles.expertAdviceText}>
            {t("Not satisfied with the chatbot's suggestions? Don't worry — you're not alone. Sometimes problems need a real human touch. Reach out to our agricultural experts for personalized help tailored to your needs.")}
          </Text>
          <TouchableOpacity
            style={styles.expertButton}
            onPress={handleExpertConsultation}
          >
            <Text style={styles.expertButtonText}>{t('Talk to an Expert')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
  },
  expertAdviceContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#81C784',
  },
  expertAdviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginVertical: 10,
  },
  expertAdviceText: {
    fontSize: 16,
    color: '#1B5E20',
    lineHeight: 22,
    marginBottom: 15,
  },
  expertButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  expertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: 15,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    backgroundColor: '#2E7D32',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: 'white',
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#FFC107',
    borderRadius: 25,
    height: 50,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#1B5E20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default Help;
