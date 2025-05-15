import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { City, Region } from '@/interfaces/destinations'
import { router } from 'expo-router'

const CityCard = ({ city }: { city: City }) => {
  const { city_name, image_url, id } = city



  return (
    <Pressable
      onPress={() => router.push(`/community/forum/${id}`)}
      className="rounded-lg shadow-md bg-white rounded-xl m-4"
    >
      <Image
        source={{ uri: image_url }}
        className="w-full h-40 rounded-xl"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center">
        <View className="flex-1 p-4">
          <Text className="text-xl font-bold">{city_name}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default CityCard

const styles = StyleSheet.create({})
