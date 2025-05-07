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

  const issueCategories: IssueCategory[] = [
    {
      key: 'technical',
      title: 'Technical Issues',
      icon: 'laptop',
      description: 'Problems with app functionality, crashes, or errors',
    },
    {
      key: 'account',
      title: 'Account Related',
      icon: 'account',
      description: 'Issues with login, profile, or account settings',
    },
    {
      key: 'payment',
      title: 'Payment Issues',
      icon: 'credit-card',
      description: 'Problems with transactions or coin purchases',
    },
    {
      key: 'feature',
      title: 'Feature Request',
      icon: 'lightbulb-on',
      description: 'Suggest new features or improvements',
    },
    {
      key: 'other',
      title: 'Other Issues',
      icon: 'help-circle',
      description: 'Any other problems or questions',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      Alert.alert(
        'Error',
        'Please select an issue category and provide a description',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Here you would make the API call to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      Alert.alert(
        'Success',
        'Your issue has been reported successfully. We will get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedCategory(null);
              setDescription('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to submit your issue. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>How can we help you?</Text>
        
        {/* Issue Categories */}
        <View style={styles.categoriesContainer}>
          {issueCategories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryCard,
                selectedCategory === category.key && styles.selectedCard,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <MaterialCommunityIcons
                name={category.icon as any}
                size={32}
                color={selectedCategory === category.key ? '#FFC107' : '#4CAF50'}
              />
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category.key && styles.selectedText,
              ]}>
                {category.title}
              </Text>
              <Text style={[
                styles.categoryDescription,
                selectedCategory === category.key && styles.selectedText,
              ]}>
                {category.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description Input */}
        {selectedCategory && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Describe your issue:</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide details about your issue..."
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Submit Button */}
        {selectedCategory && (
          <Button
            title={loading ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={loading}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonText}
            containerStyle={styles.submitButtonContainer}
          />
        )}
        {loading && <ActivityIndicator style={styles.loader} color="#4CAF50" />}
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