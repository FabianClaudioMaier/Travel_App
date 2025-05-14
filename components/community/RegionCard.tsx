import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Region } from '@/interfaces/destinations'
import { router } from 'expo-router'

const RegionCard = ({ region }: { region: Region }) => {
  const { name, description, image_url, id } = region

  const handlePress = () => {
    router.push(`/community/${id}`)
  }

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-lg shadow-md bg-white rounded-xl m-4"
    >
      <Image
        source={{ uri: image_url }}
        className="w-full h-40 rounded-xl"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center">
        <View className="flex-1 p-4">
          <Text className="text-xl font-bold">{name}</Text>
          <Text className="text-md text-gray-500">{description}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default RegionCard

const styles = StyleSheet.create({})
