import React from 'react';
import { ImageBackground, StyleSheet, Text, View, Dimensions } from 'react-native';
import RegionSwiper from '@/components/RegionSwiper';
import TripConfigurator from '@/components/Search/TripConfigurator'

// Get device dimensions for responsive styling
const { width, height } = Dimensions.get('window');

/**
 * Index screen: shows the trip configurator overlaying
 * a background swiper of regions.
 */
export default function Index() {
  return (
  <View style={styles.container}>
    {/* Overlay search box at top */}
    <View style={styles.searchBox}>
      <TripConfigurator />
    </View>

    {/* Fullscreen swiper underneath */}
    <View style={styles.swiperContainer}>
      <RegionSwiper />
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // fill screen
  },
  searchBox: {
    position: 'absolute', // overlay on top of swiper
    top: height * 0.05,   // 5% down from top
    alignSelf: 'center',   // center horizontally
    width: width * 0.9,    // 90% of screen width
    minHeight: height * 0.6, // at least 60% of screen height
    zIndex: 1,             // ensure above swiper
  },
  swiperContainer: {
    flex: 1,   // fill remaining space
    zIndex: 0, // behind search box
  },
});
