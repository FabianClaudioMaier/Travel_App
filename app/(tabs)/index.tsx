import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import RegionSwiper from '@/components/RegionSwiper';

export default function Index() {
  return (
    <ImageBackground
      source={require('../../assets/images/greek-coast-sunshine.png')}
      style={styles.background}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.swiperContainer}>
          <Text className="text-black text-3xl font-bold mb-4 text-center">Explore our regions</Text>
          <RegionSwiper />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  swiperContainer: {
    backgroundColor: 'white',
    height: 400,
    margin: 16,
    borderRadius: 16,
  },
});
