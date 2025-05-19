import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_KEY = 'userProfile';

const services = [
  "Sign Language",
  "Wheelchair",
  "Assistant Animal",
  "Braile Script",
  "Hearing Aid",
  "Stroller"
];

const RequiredServices = () => {
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    const loadSelected = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.requiredServices) {
            setSelected(profile.requiredServices);
          }
        }
      } catch (e) {
        console.warn('Fehler beim Laden der Services:', e);
      }
    };
    loadSelected();
  }, []);

  const toggleSelection = async (service: string) => {
    try {
      const newSelected = selected.includes(service)
        ? selected.filter(item => item !== service)
        : [...selected, service];

      setSelected(newSelected);

      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = storedProfile ? JSON.parse(storedProfile) : {};
      const updatedProfile = { ...profile, requiredServices: newSelected };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Fehler beim Speichern:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Select your required Services</Text>
      <View style={styles.grid}>
        {services.map((service, index) => {
          const isActive = selected.includes(service);
          return (
            <Pressable
              key={index}
              onPress={() => toggleSelection(service)}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
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