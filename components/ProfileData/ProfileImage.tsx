// components/ProfileImage.tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

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
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: '#ccc',
  },
});

export default ProfileImage;