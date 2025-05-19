import { Image, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import React from 'react';
import { City } from '@/interfaces/destinations';
import Icon from 'react-native-vector-icons/Ionicons';

const CityCard = ({ city }: { city: City }) => {
  const { city_name, image_url } = city;

  const handlePress = () => {
    const query = encodeURIComponent(`Hotels in ${city_name}`);
    const url = `https://www.google.com/search?q=${query}`;
    Linking.openURL(url).catch(err =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <TouchableOpacity
      className="rounded-lg shadow-md bg-white rounded-xl m-4"
      onPress={handlePress}
    >
      <Image
        source={{ uri: image_url }}
        className="w-full h-40 rounded-xl"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center p-4">
          <Text className="text-xl font-bold">Find Hotels in {city_name}</Text>
          <Icon name="open-outline" size={24}/>
      </View>
    </TouchableOpacity>
  );
};

export default CityCard;

const styles = StyleSheet.create({});
