import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-swiper';
import { Region } from '@/interfaces/destinations';
import api from '@/services/api';

/**
 * A swiper component that displays destination regions in a carousel.
 * Fetches region data from the backend and renders each region with image and description.
 */
const RegionSwiper = () => {
  // State to hold the list of regions
  const [regions, setRegions] = useState<Region[]>([]);

  // State to track whether data is currently loading
  const [loadingRegions, setLoadingRegions] = useState(false);

  /**
   * Fetches all available regions from the API.
   * This function is memoized with useCallback to avoid unnecessary re-creation.
   */
  const fetchRegions = useCallback(async () => {
    setLoadingRegions(true); // Start loading spinner
    try {
      const regions = await api.destinations.getAllRegions(); // API call
      setRegions(regions); // Store result in state
    } catch (error) {
      console.error("Error fetching regions", error);
    } finally {
      setLoadingRegions(false); // Stop loading spinner
    }
  }, []);

  /**
   * Triggers region data fetching on component mount.
   */
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Show a loading spinner while data is being fetched
  if (loadingRegions) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Swiper
      loop                         // Enables infinite looping
      showsPagination              // Show pagination dots
      dotColor="rgba(255,255,255,0.5)"     // Color of inactive dots
      activeDotColor="#fff"               // Color of active dot
      autoplay                     // Enables auto-rotation
      autoplayTimeout={4}         // 4 seconds per slide
      className="rounded-b-2xl"
    >
      {/* Render each region as a swiper slide */}
      {regions.map((region) => (
        <View key={region.id} className="flex-1 justify-end">
          <Image
            source={{ uri: region.image_url }}  // Region background image
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"                 // Cover entire area
          />
          {/* Overlay for text with dark background */}
          <View className="bg-black/60 pb-xl pt-sm px-sm">
            <Text className="text-2xl font-bold text-white mb-sm">{region.name}</Text>
            <Text className="text-base text-gray-100 mb-sm">{region.description}</Text>
          </View>
        </View>
      ))}
    </Swiper>
  );
};

export default RegionSwiper;
