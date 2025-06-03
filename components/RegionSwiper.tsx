// components/RegionSwiper.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import { Region } from '@/interfaces/destinations';
import api from '@/services/api';

interface RegionSwiperProps {
  /**
   * Callback, das aufgerufen wird, wenn der Benutzer auf den
   * Regionsnamen klickt. Wir übergeben dann die region.id zurück.
   */
  onRegionPress?: (regionId: string) => void;
}

const RegionSwiper: React.FC<RegionSwiperProps> = ({ onRegionPress }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const fetchRegions = useCallback(async () => {
    setLoadingRegions(true);
    try {
      const regs = await api.destinations.getAllRegions();
      setRegions(regs);
    } catch (error) {
      console.error('Error fetching regions', error);
    } finally {
      setLoadingRegions(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  if (loadingRegions) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Swiper
      loop
      showsPagination
      dotColor="rgba(255,255,255,0.5)"
      activeDotColor="#fff"
      autoplay
      autoplayTimeout={4}
      className="rounded-b-2xl"
    >
      {regions.map((region) => (
        <View key={region.id} className="flex-1 justify-end">
          <Image
            source={{ uri: region.image_url }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <View className="bg-black/60 pb-xl pt-sm px-sm">
            {/* Hier machen wir den Regionsnamen anklickbar */}
            <TouchableOpacity
              onPress={() => {
                if (onRegionPress) {
                  onRegionPress(region.id);
                }
              }}
            >
              <Text className="text-2xl font-bold text-white mb-sm">
                {region.name}
              </Text>
            </TouchableOpacity>
            <Text className="text-base text-gray-100 mb-sm">
              {region.description}
            </Text>
          </View>
        </View>
      ))}
    </Swiper>
  );
};

export default RegionSwiper;
