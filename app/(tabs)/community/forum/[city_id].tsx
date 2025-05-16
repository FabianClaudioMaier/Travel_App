import CreatePostButton from '@/components/community/forum/CreatePostButton'
import PostCard from '@/components/community/forum/PostCard'
import { City } from '@/interfaces/destinations'
import { Posts } from '@/interfaces/forum'
import api from '@/services/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'

const CityForum = () => {
  const { city_id } = useLocalSearchParams()

  const [city, setCity] = useState<City>()
  const [posts, setPosts] = useState<Posts>([])
  
  const fetchCity = async () => {
    try {
      const cityData = await api.destinations.getCityById(city_id as string)
      setCity(cityData)
    } catch (error) {
      console.error('Error fetching city:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const posts = await api.forum.getPostsByRegionId(city?.region_id as string)
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPosts(posts)
    } catch (error) {
      console.error('Error fetching posts:', error) 
    }
  }
  
  useEffect(() => {
    fetchCity()
    fetchPosts()
  }, [])

  return (
    <View className="flex-1 relative">
      
      <View className="bg-white p-4 shadow-sm">
        <Text className="text-2xl font-bold">{city?.city_name}, {city?.country}</Text>
        <Text className="text-sm text-gray-500">{city?.region_name}</Text>
      </View>

      <View className="flex-1">
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
        />
      </View>

      <CreatePostButton region_id={city?.region_id as string} onPostCreated={fetchPosts} />
  </View>


  )
}

export default CityForum


