import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Switch, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

// Key used for storing and retrieving user profile data in AsyncStorage
const PROFILE_STORAGE_KEY = 'userProfile';

/**
 * ProfileAnonymous component manages and displays a toggle
 * for enabling anonymous mode in the user profile.
 *
 * Reads and writes the `anonymous` flag to AsyncStorage under PROFILE_STORAGE_KEY.
 *
 * @returns {JSX.Element} A view containing a label and a switch.
 */
const ProfileAnonymous = (): JSX.Element => {
  // Local state for anonymous mode toggle
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Local state for the full profile object as stored
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string; password?: string; anonymous?: boolean }>({});

  /**
   * Load the profile from AsyncStorage on mount
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          // Set toggle based on stored anonymous flag (truthy value coerced to boolean)
          setIsAnonymous(!!profile.anonymous);
          // Store entire profile object for updates
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Error loading profile for anonymous mode:', e);
      }
    };

    loadProfile();
  }, []);

  /**
   * Toggle anonymous mode and persist the updated profile
   */
  const toggleAnonymous = async (): Promise<void> => {
    // Create updated profile object with flipped anonymous flag
    const updatedProfile = { ...currentProfile, anonymous: !isAnonymous };
    // Update UI state immediately
    setIsAnonymous(!isAnonymous);
    setCurrentProfile(updatedProfile);

    try {
      // Save updated profile back to AsyncStorage
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving anonymous mode preference:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Label for the anonymous mode toggle */}
      <Text style={styles.label}>Anonymous Mode</Text>

      {/* Switch component to toggle anonymous mode on/off */}
      <Switch
        value={isAnonymous}
        onValueChange={toggleAnonymous}
        thumbColor={isAnonymous ? '#1a1a1a' : '#ccc'}
        trackColor={{ false: '#ddd', true: '#aaa' }}
        accessibilityLabel="Toggle anonymous mode"
      />

      {/*
        The editIcon import is available for future use if you plan
        to allow editing profile details beside the toggle. Currently unused.
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
    borderRadius: 6,

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