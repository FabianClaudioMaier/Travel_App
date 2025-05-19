import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key used to store user profile data in AsyncStorage
const PROFILE_STORAGE_KEY = 'userProfile';

/**
 * ProfileEmail component allows viewing and editing
 * of the user's email address, persisting changes to AsyncStorage.
 *
 * @returns {JSX.Element} A view containing an email input and edit icon.
 */
const ProfileEmail = (): JSX.Element => {
  // Local state for the email input value
  const [email, setEmail] = useState<string>('');
  // Local state for the full profile object for merging updates
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string }>({});

  /**
   * Loads the stored profile from AsyncStorage on component mount
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          // Initialize email state from stored profile or default to empty
          setEmail(profile.email || '');
          // Keep the rest of profile for future updates
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Error loading profile (Email):', e);
      }
    };

    loadProfile();
  }, []);

  /**
   * Handles changes to the email input
   * Updates state and persists the new email in AsyncStorage
   *
   * @param {string} text - The new email text from the input
   */
  const handleEmailChange = async (text: string): Promise<void> => {
    // Update local email state for immediate UI feedback
    setEmail(text);
    // Merge updated email into full profile object
    const updatedProfile = { ...currentProfile, email: text };
    setCurrentProfile(updatedProfile);

    try {
      // Persist updated profile in storage
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving email to profile:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Text input for email with appropriate keyboard and accessibility */}
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={handleEmailChange}
        placeholder="E-Mail"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email address input"
      />

      {/* Edit icon to indicate the field is editable */}
      <View style={styles.iconContainer}>
        <Image
          source={require('@/assets/images/edit.png')}
          style={styles.icon}
          accessibilityLabel="Edit email icon"
        />
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