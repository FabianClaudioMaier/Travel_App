import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

// Key used for storing and retrieving user profile in AsyncStorage
const PROFILE_STORAGE_KEY = 'userProfile';

/**
 * ProfileName component allows viewing and editing
 * of the user's name, with persistence in AsyncStorage.
 *
 * @returns {JSX.Element} A row containing a TextInput for the name and an edit icon.
 */
const ProfileName = (): JSX.Element => {
  // Local state for the name input value
  const [name, setName] = useState<string>('');
  // Local state holding the full profile object for merging updates
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string }>({});

  /**
   * Load the profile on mount and initialize the name state
   */
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        // Retrieve stored profile JSON
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          // Initialize name or default to empty string
          setName(profile.name || '');
          // Preserve entire profile object for updates
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Error loading profile (Name):', e);
      }
    };

    loadProfile();
  }, []);

  /**
   * Handle name changes from the input field
   * Updates state and persists the new name
   *
   * @param {string} text - New name value
   */
  const handleNameChange = async (text: string): Promise<void> => {
    // Immediate UI update
    setName(text);
    // Merge new name into profile object
    const updatedProfile = { ...currentProfile, name: text };
    setCurrentProfile(updatedProfile);

    try {
      // Persist updated profile
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving name to profile:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* TextInput for user's name with styling and placeholder */}
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={handleNameChange}
        placeholder="Your Name"
        placeholderTextColor="#999"
        accessibilityLabel="Name input field"
      />

      {/* Edit icon indicating field is editable */}
      <View style={styles.iconContainer}>
        <Image
          source={editIcon}
          style={styles.icon}
          accessibilityLabel="Edit name icon"
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

export default ProfileName;