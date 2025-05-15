import { Cities, Region } from '@/interfaces/destinations'
import api from '@/services/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Text, View } from 'react-native'
import CityCard from '@/components/community/CityCard'

const CommunityDetail = () => {
  const { region_id } = useLocalSearchParams()
  const [region, setRegion] = useState<Region>()
  const [cities, setCities] = useState<Cities>()

  const fetchRegion = async () => {
    const region = await api.destinations.getRegionById(region_id as string)
    setRegion(region)
  }

  const fetchCities = async () => {
    const cities = await api.destinations.getCitiesByRegion(region_id as string)
    setCities(cities)
  }

  useEffect(() => {
    fetchRegion()
    fetchCities()
  }, [])

  return (
    <View className="flex-1">
      <View className="relative">
        <Image 
          source={{ uri: region?.image_url }} 
          className="w-full h-48 absolute top-0"
        />
        <View className="bg-black/60 pt-sm px-sm pb-xl mt-48">
          <Text className="text-2xl font-bold text-white mb-sm">{region?.name}</Text>
          <Text className="text-base text-gray-100 mb-sm">{region?.description}</Text>
        </View>
      </View>
      <FlatList
        data={cities}
        renderItem={({ item }) => <CityCard city={item} />}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16 }}
      />
    </View>
  )
}

export default CommunityDetail