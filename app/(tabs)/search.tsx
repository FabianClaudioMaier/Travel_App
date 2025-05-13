import { ImageBackground, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import TripConfigurator from '@/components/TripConfigurator'

const Search = () => {
  return (
    <ImageBackground
      source={require('../../assets/images/greek-coast-sunshine.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <TripConfigurator />
      </View>
    </ImageBackground>
  )
}

export default Search

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  container: {
    flex: 1,
  }
})