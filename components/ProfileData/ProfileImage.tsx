// components/ProfileImage.tsx
import React from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const ProfileImage = () => {
  return (
    <View style={styles.imageContainer}>
      <Image
        style={styles.image}
        resizeMode="cover"
        source={require('@/assets/images/profile_placeholder.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: width*0.5,
    height: width*0.5,
    borderRadius: width*0.25,
    borderWidth: 2,
    borderColor: '#000',
  },
});

export default ProfileImage;