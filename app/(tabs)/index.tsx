import React from 'react';
import { ImageBackground, StyleSheet, Text, View, Dimensions } from 'react-native';
import RegionSwiper from '@/components/RegionSwiper';
import TripConfigurator from '@/components/Search/TripConfigurator'

const { width, height } = Dimensions.get('window');

export default function Index() {
  return (
    <View>
      <View style={styles.searchBox}>
          <TripConfigurator />
      </View>
      <View style={styles.swiperContainer}>
        <RegionSwiper />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  searchBox: {
      position: 'absolute',
      alignSelf: 'center',
      top: height*0.05,
      width: '90%',
      minHeight: '60%',
  },
  swiperContainer: {
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});
