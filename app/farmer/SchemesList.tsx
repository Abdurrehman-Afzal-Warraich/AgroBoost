import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ImageBackground, ActivityIndicator , Text} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Card, Icon } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { useSchemes } from '../hooks/useSchemes';

const backgroundImage = require('../../assets/images/farmer-icons/pexels-saeed-ahmed-abbasi-480825745-16446598.jpg');

const SchemesList = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { schemes, loading, error } = useSchemes();
  
  const handleSchemePress = React.useCallback((schemeId: string) => {
    router.push({ 
      pathname: '/farmer/SchemeDetails' as any,
      params: { schemeId }
    });
  }, [router]);

  

  if (loading) {
    return (
      <  View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#61B15A" />
      </  View>
    );
  }

  if (error) {
    return (
      <  View style={styles.errorContainer}>
        <  Text style={styles.errorText}>{error}</  Text>
      </  View>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <  View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.textContainer}>
            <  Text style={styles.titleText}>
              کل کے لیے سرمایہ کاری
            </  Text>
            <  Text style={styles.bodyText}>
              کاشتکاروں اور زرعی صنعت کاروں کی ضروریا�� کو پورا کرنے کے لیے زرعی ترقیاتی بینک لیڈ چھوٹے کسانوں کے ان کے مالی ضروریات پورا کرنے اور اپنے کنبوں کے لیے بہتر زندگی گزارنے کے لیے مالی تحفظ کے مسائل اور رہن کی بنیاد پر جدید زرعی سپلائی اور سروسز کی شناخت کرنے میں مدد کرنے کے لیے جدید اقدامات کرنے کی کوشش کرتا ہے۔
            </  Text>
          </View>

          {schemes.map((scheme) => (
            <TouchableOpacity 
              key={scheme.id}
              onPress={() => handleSchemePress(scheme.id)}
            >
              <Card containerStyle={styles.card}>
                <View style={styles.cardContent}>
                  <  Text style={styles.schemeTitle} numberOfLines={2}>
                    {scheme.Title}
                  </  Text>
                  <Icon
                    name="chevron-right"
                    type="material"
                    color="#61B15A"
                    size={24}
                    containerStyle={[
                      styles.chevron,
                      { transform: [{ scaleX: i18n.language === 'ur' ? -1 : 1 }] }
                    ]}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </  View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better readability
  },
  scrollContent: {
    padding: 15,
    paddingTop: 15,
  },
  textContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly transparent background for text
    borderRadius: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'justify',
  },
  tractorImage: {
    width: '100%', // Make the image responsive
    height: 200, // Set a fixed height or adjust as needed
    borderRadius: 10,
    marginBottom: 10,
  },
  card: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent cards
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    lineHeight: 28,
  },
  chevron: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SchemesList; 