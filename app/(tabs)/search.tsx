import TripConfigurator from '@/components/Search/TripConfigurator'
import React from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'

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