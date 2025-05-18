import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_KEY = 'userProfile';

const ProfileEmail = () => {
  const [email, setEmail] = useState('');
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string }>({});

  // Profil laden
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          setEmail(profile.email || '');
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Fehler beim Laden des Profils (E-Mail):', e);
      }
    };
    loadProfile();
  }, []);

  // Email ändern und speichern
  const handleEmailChange = async (text: string) => {
    setEmail(text);
    const updatedProfile = { ...currentProfile, email: text };
    setCurrentProfile(updatedProfile);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Fehler beim Speichern der E-Mail:', e);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={handleEmailChange}
        placeholder="E-Mail"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.iconContainer}>
        <Image source={require('@/assets/images/edit.png')} style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default ProfileEmail;