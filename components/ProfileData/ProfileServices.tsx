// components/ProfileData/RequiredServices.tsx
import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key used for storing and retrieving the user profile in AsyncStorage
const PROFILE_STORAGE_KEY = 'userProfile';

// Available services for the user to select
const services = [
  "Sign Language",
  "Wheelchair",
  "Assistant Animal",
  "Braile Script",
  "Hearing Aid",
  "Stroller"
];

/**
 * RequiredServices component displays a grid of selectable assistive services.
 * When the user taps a service, it toggles its selection state and stores
 * the updated list of requiredServices in AsyncStorage under PROFILE_STORAGE_KEY.
 *
 * @returns {JSX.Element} A SafeAreaView containing header text and service chips.
 */
const RequiredServices = (): JSX.Element => {
  // State array tracking which services are currently selected
  const [selected, setSelected] = React.useState<string[]>([]);

  /**
   * Load any previously selected services from storage on component mount.
   */
  React.useEffect(() => {
    const loadSelected = async (): Promise<void> => {
      try {
        // Retrieve stored profile JSON
        const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          // Initialize selected services if available
          if (profile.requiredServices) {
            setSelected(profile.requiredServices);
          }
        }
      } catch (e) {
        console.warn('Error loading required services:', e);
      }
    };
    loadSelected();
  }, []);

  /**
   * Toggle the selection state of a service and persist the change.
   * @param {string} service - The service name to toggle
   */
  const toggleSelection = async (service: string): Promise<void> => {
    try {
      // Create a new array with the service added or removed
      const newSelected = selected.includes(service)
        ? selected.filter(item => item !== service)
        : [...selected, service];

      // Update component state immediately
      setSelected(newSelected);

      // Retrieve existing profile or initialize an empty object
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = storedProfile ? JSON.parse(storedProfile) : {};
      // Merge updated requiredServices into the profile
      const updatedProfile = { ...profile, requiredServices: newSelected };
      // Persist the updated profile back to storage
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Error saving required services:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header prompting the user */}
      <Text style={styles.header}>Select your required Services</Text>

      {/* Grid of chips representing each service */}
      <View style={styles.grid}>
        {services.map((service, index) => {
          const isActive = selected.includes(service);
          return (
            <Pressable
              key={index} // index used as key since services array is static
              onPress={() => toggleSelection(service)}
              style={[
                styles.chip,
                isActive ? styles.chipActive : styles.chipInactive
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={styles.labelText}>{service}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-Medium",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  chip: {
    width: "48%",
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#dadada",
  },
  chipInactive: {
    borderWidth: 1,
    borderColor: "#dadada",
    backgroundColor: "transparent",
  },
  labelText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: "Roboto-Medium",
    color: "#000",
    textAlign: "center",
  },
});

export default RequiredServices;