import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BoatIcon from "@/assets/images/boatIcon.png";
import BusIcon from "@/assets/images/busIcon.png";
import TrainIcon from "@/assets/images/trainIcon.png";
import PlaneIcon from "@/assets/images/planeIcon.png";

const transportOptions = [
  { id: "boat", icon: BoatIcon },
  { id: "bus", icon: BusIcon },
  { id: "train", icon: TrainIcon },
  { id: "plane", icon: PlaneIcon },
];

const STORAGE_KEY = "preferred_transportation";

const TransportationSelector = () => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const loadSelection = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSelected(parsed);
        } catch (e) {
          console.warn("Failed to parse saved transport selection.");
        }
      }
    };
    loadSelection();
  }, []);

  const handleToggle = async (optionId: string) => {
    const isSelected = selected.includes(optionId);
    const updated = isSelected
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    setSelected(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Prefered Transportation</Text>
      <View style={styles.iconRow}>
        {transportOptions.map(({ id, icon }) => {
          const isSelected = selected.includes(id);
          return (
            <Pressable
              key={id}
              style={[
                styles.iconBox,
                isSelected && styles.selectedBox,
              ]}
              onPress={() => handleToggle(id)}
            >
              <Image
                source={icon}
                style={[
                  styles.icon,
                  !isSelected && styles.unselectedIcon,
                ]}
                resizeMode="contain"
              />
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
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  iconBox: {
    height: 54,
    width: 54,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(217, 217, 217, 0)",
  },
  selectedBox: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: "black",
  },
  unselectedIcon: {
    opacity: 0.2,
  },
});

export default TransportationSelector;