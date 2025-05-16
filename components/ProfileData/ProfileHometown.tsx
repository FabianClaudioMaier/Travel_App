import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

const PROFILE_STORAGE_KEY = 'userProfile';

const ProfileHometown = () => {
  const [hometown, setHometown] = useState('');
  const [currentProfile, setCurrentProfile] = useState<{
    name?: string;
    email?: string;
    password?: string;
    hometown?: string;
    anonymous?: boolean;
  }>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          setHometown(profile.hometown || '');
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Fehler beim Laden der Hometown:', e);
      }
    };
    loadProfile();
  }, []);

  const handleHometownChange = async (text: string) => {
    setHometown(text);
    const updatedProfile = { ...currentProfile, hometown: text };
    setCurrentProfile(updatedProfile);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Fehler beim Speichern der Hometown:', e);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={hometown}
        onChangeText={handleHometownChange}
        placeholder="Hometown"
        placeholderTextColor="#999"
      />
      <View style={styles.iconContainer}>
        <Image source={editIcon} style={styles.icon} />
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

export default ProfileHometown;