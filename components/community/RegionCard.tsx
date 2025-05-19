import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Region } from '@/interfaces/destinations';
import { router } from 'expo-router';

/**
 * RegionCard component displays a region image, name, and description,
 * and navigates to the community page for that region when pressed.
 *
 * @param {Object} props - Component props
 * @param {Region} props.region - Region object containing id, name, description, and image URL
 * @returns {JSX.Element} Touchable card element
 */
const RegionCard = ({ region }: { region: Region }): JSX.Element => {
  // Destructure the relevant fields from the region object
  const { id, name, description, image_url } = region;

  /**
   * Called when the user presses the card.
   * Uses Expo Router to navigate to the community page for this region.
   */
  const handlePress = (): void => {
    // Navigate to /community/[id]
    router.push(`/community/${id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8} // Provide visual feedback on press
      className="rounded-lg shadow-md bg-white rounded-xl m-4"
    >
      {/* Region image */}
      <Image
        source={{ uri: image_url }}
        className="w-full h-40 rounded-xl"
        resizeMode="cover"
        accessibilityLabel={`Image of ${name} region`}
      />

      {/* Text container */}
      <View className="flex-row justify-between items-center">
        <View className="flex-1 p-4">
          {/* Region name */}
          <Text className="text-xl font-bold">
            {name}
          </Text>
          {/* Region description */}
          <Text className="text-md text-gray-500">
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RegionCard;

const styles = StyleSheet.create({})
