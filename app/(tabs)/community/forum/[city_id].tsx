import { Cities, City, Region } from '@/interfaces/destinations'
import api from '@/services/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Text, View } from 'react-native'
import CityCard from '@/components/community/CityCard'
import PostCard from '@/components/community/forum/PostCard'

const CityForum = () => {
  const { city_id } = useLocalSearchParams()
  const [city, setCity] = useState<City>()
  const [region, setRegion] = useState<Region>()
  
  const fetchCityAndRegion = async () => {
    try {
      const cityData = await api.destinations.getCityById(city_id as string)
      setCity(cityData)
      
      const regionData = await api.destinations.getRegionById(cityData.region_id)
      setRegion(regionData)
    } catch (error) {
      console.error('Error fetching city and region:', error)
    }
  }

  const posts = [
    {
      id: '1',
      title: 'Post 1',
      rating: 5,
      content: 'Content 1',
      author: 'Author 1',
      date: '2021-01-01',
      images: ['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']
    },
    {
      id: '2',
      title: 'Post 2',
      rating: 4,
      content: 'Content 2',
      author: 'Author 2',
      date: '2021-01-02',
      images: ['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']
    }
  ]
  useEffect(() => {
    fetchCityAndRegion()
  }, [])

  return (
    <View className="flex-1">
      <View className="bg-white p-4 shadow-sm">
        <Text className="text-2xl font-bold">{city?.city_name}, {city?.country}</Text>
        <Text className="text-sm text-gray-500">{region?.name}</Text>
      </View>
      <View className="flex-1 p-4">
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  )
}

export default CityForum