import { Cities, City, Region } from '@/interfaces/destinations'
import api from '@/services/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CityCard from '@/components/community/CityCard'
import PostCard from '@/components/community/forum/PostCard'
import { Posts } from '@/interfaces/forum'
import { FontAwesome, Ionicons, Octicons } from '@expo/vector-icons'
import CreatePostButton from '@/components/community/forum/CreatePostButton'

const CityForum = () => {
  const { city_id } = useLocalSearchParams()

  const [city, setCity] = useState<City>()
  const [region, setRegion] = useState<Region>()
  const [posts, setPosts] = useState<Posts>([])
  
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

  const fetchPosts = async () => {
    try {
      const posts = await api.forum.getPostsByCityId(city_id as string)
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPosts(posts)
    } catch (error) {
      console.error('Error fetching posts:', error) 
    }
  }
  
  useEffect(() => {
    fetchCityAndRegion()
    fetchPosts()
  }, [])

  return (
    <View className="flex-1 relative">
      
      <View className="bg-white p-4 shadow-sm">
        <Text className="text-2xl font-bold">{city?.city_name}, {city?.country}</Text>
        <Text className="text-sm text-gray-500">{region?.name}</Text>
      </View>

      <View className="flex-1">
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
        />
      </View>

      <CreatePostButton city_id={city_id as string} />
  </View>


  )
}

export default CityForum


