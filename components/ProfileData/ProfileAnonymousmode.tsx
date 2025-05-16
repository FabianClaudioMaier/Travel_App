import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Switch, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

const PROFILE_STORAGE_KEY = 'userProfile';

const ProfileAnonymous = () => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string; password?: string; anonymous?: boolean }>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          setIsAnonymous(!!profile.anonymous);
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Fehler beim Laden des Profils (Anonymous Mode):', e);
      }
    };
    loadProfile();
  }, []);

  const toggleAnonymous = async () => {
    const updatedProfile = { ...currentProfile, anonymous: !isAnonymous };
    setIsAnonymous(!isAnonymous);
    setCurrentProfile(updatedProfile);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Fehler beim Speichern des Anonymous Mode:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Anonymous Mode</Text>
      <Switch
        value={isAnonymous}
        onValueChange={toggleAnonymous}
        thumbColor={isAnonymous ? '#1a1a1a' : '#ccc'}
        trackColor={{ false: '#ddd', true: '#aaa' }}
      />
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  label: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#1a1a1a',
    textAlign: 'center',
    width: 130,
  },
  iconContainer: {
    width: 16,
    height: 16,
    marginHorizontal: 8,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default ProfileAnonymous;