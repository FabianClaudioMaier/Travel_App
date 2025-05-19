import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

// Key for storing and retrieving the complete user profile in AsyncStorage
const PROFILE_STORAGE_KEY = 'userProfile';

/**
 * ProfileHometown component provides an input field for the user's hometown,
 * loading the existing value from AsyncStorage and persisting updates.
 *
 * @returns {JSX.Element} A view containing a text input and an edit icon.
 */
const ProfileHometown = (): JSX.Element => {
  // Local state for the hometown input value
  const [hometown, setHometown] = useState<string>('');

  // Local state for the complete profile object to merge updates
  const [currentProfile, setCurrentProfile] = useState<{
    name?: string;
    email?: string;
    password?: string;
    hometown?: string;
    anonymous?: boolean;
  }>({});

  /**
   * Load the stored profile on component mount and initialize state
   */
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        // Retrieve the JSON string from storage
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          // Initialize hometown state or default to empty string
          setHometown(profile.hometown || '');
          // Keep the rest of the profile for future updates
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Error loading hometown from profile:', e);
      }
    };

    loadProfile();
  }, []);

  /**
   * Handle changes to the hometown input field
   * @param {string} text - New hometown value from TextInput
   */
  const handleHometownChange = async (text: string): Promise<void> => {
    // Update local state for immediate UI feedback
    setHometown(text);
    // Merge updated hometown into full profile object
    const updatedProfile = { ...currentProfile, hometown: text };
    setCurrentProfile(updatedProfile);

    try {
      // Persist updated profile back to AsyncStorage
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving hometown to profile:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Text input for hometown with placeholder and styling */}
      <TextInput
        style={styles.input}
        value={hometown}
        onChangeText={handleHometownChange}
        placeholder="Hometown"
        placeholderTextColor="#999"
        accessibilityLabel="Hometown input field"
      />

      {/* Edit icon indicating the field is editable */}
      <View style={styles.iconContainer}>
        <Image
          source={editIcon}
          style={styles.icon}
          accessibilityLabel="Edit hometown icon"
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

export default ProfileHometown;