// components/ProfileData/ProfileImage.tsx
import React from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';

// Get device screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

/**
 * ProfileImage component displays a circular placeholder image
 * centered horizontally with a border.
 *
 * The image size is 50% of the screen width, maintaining a square aspect ratio.
 *
 * @returns {JSX.Element} A view wrapping the profile image.
 */
const ProfileImage = (): JSX.Element => {
  return (
    <View style={styles.imageContainer}>
      {/* Profile picture placeholder */}
      <Image
        style={styles.image}
        resizeMode="cover"
        source={require('@/assets/images/profile_placeholder.png')}
        accessibilityLabel="Profile placeholder image"
      />
    </View>
  );
};

// Define styles for the image container and the image itself
const styles = StyleSheet.create({
  imageContainer: {
    // Center the image horizontally
    alignItems: 'center',
    // Space below the image
    marginBottom: 20,
  },
  image: {
    // Set width and height to 50% of screen width
    width: width * 0.5,
    height: width * 0.5,
    // Make the image circular
    borderRadius: (width * 0.5) / 2,
    // Add a solid border around the image
    borderWidth: 2,
    borderColor: '#000',
  },
});

export default ProfileImage;