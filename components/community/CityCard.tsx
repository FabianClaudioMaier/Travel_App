import { Image, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import React from 'react';
import { City } from '@/interfaces/destinations';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * CityCard component displays a city image and a call-to-action
 * to search for hotels in the specified city.
 *
 * @param {Object} props - Component props
 * @param {City} props.city - City object containing name and image URL
 * @returns {JSX.Element} Touchable card element
 */
const CityCard = ({ city }: { city: City }): JSX.Element => {
  // Destructure the relevant fields from the city object
  const { city_name, image_url } = city;

  /**
   * Called when the user presses the card.
   * Constructs a Google search URL for hotels in the city
   * and attempts to open it in the device's browser.
   */
  const handlePress = (): void => {
    // Encode the search query parameter to handle spaces and special characters
    const query = encodeURIComponent(`Hotels in ${city_name}`);
    const url = `https://www.google.com/search?q=${query}`;

    // Attempt to open the URL; log an error if it fails
    Linking.openURL(url).catch((err: Error) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <TouchableOpacity
      className="rounded-lg shadow-md bg-white rounded-xl m-4"
      onPress={handlePress}
      activeOpacity={0.8} // Add visual feedback on press
    >
      {/* City image */}
      <Image
        source={{ uri: image_url }}
        className="w-full h-40 rounded-xl"
        resizeMode="cover"
        accessibilityLabel={`Image of ${city_name}`}
      />

      {/* Footer with text and icon */}
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-xl font-bold">
          Find Hotels in {city_name}
        </Text>
        <Icon
          name="open-outline"
          size={24}
          accessibilityLabel="Open link icon"
        />
      </View>
    </TouchableOpacity>
  );
};

export default CityCard;

const styles = StyleSheet.create({});
