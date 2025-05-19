import React, { useEffect, useState } from 'react';
import { TextInput, StyleSheet, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import editIcon from '@/assets/images/edit.png';

// Storage key for persisting user profile data
const PROFILE_STORAGE_KEY = 'userProfile';

/**
 * ChangePassword component provides an input field for updating
 * the user's password, loading the initial value from AsyncStorage
 * and saving updates back to storage.
 *
 * @returns {JSX.Element} A view containing a password input and edit icon.
 */
const ChangePassword = (): JSX.Element => {
  // Local state for the password input field
  const [password, setPassword] = useState<string>('');
  // Local state representing the complete profile object
  const [currentProfile, setCurrentProfile] = useState<{ name?: string; email?: string; password?: string }>({});

  /**
   * Load stored profile data on component mount,
   * initializing the password state
   */
  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          // Initialize password or default to empty string
          setPassword(profile.password || '');
          // Preserve profile object for updates
          setCurrentProfile(profile);
        }
      } catch (e) {
        console.warn('Error loading profile (Password):', e);
      }
    };

    loadProfile();
  }, []);

  /**
   * Handle password changes from the TextInput
   * Updates state and persists the new password
   *
   * @param {string} text - The new password value
   */
  const handlePasswordChange = async (text: string): Promise<void> => {
    // Update local password state for immediate feedback
    setPassword(text);
    // Merge new password into the full profile object
    const updatedProfile = { ...currentProfile, password: text };
    setCurrentProfile(updatedProfile);

    try {
      // Persist updated profile to AsyncStorage
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving password to profile:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Secure TextInput for password entry */}
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={handlePasswordChange}
        placeholder="Change Password"
        placeholderTextColor="#999"
        secureTextEntry={true}
        accessibilityLabel="Password input field"
      />

      {/* Edit icon indicating the field is editable */}
      <View style={styles.iconContainer}>
        <Image
          source={editIcon}
          style={styles.icon}
          accessibilityLabel="Edit password icon"
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

export default ChangePassword;