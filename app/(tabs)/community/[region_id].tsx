import CreatePostButton from '@/components/community/forum/CreatePostButton'
import PostCard from '@/components/community/forum/PostCard'
import { Region, Cities } from '@/interfaces/destinations'
import { Posts } from '@/interfaces/forum'
import api from '@/services/api'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'

/**
 * RegionForum
 * Displays a forum view for a given region, with optional
 * filtering by city, and a button to create new posts.
 */

const RegionForum = () => {
  const { region_id, autoOpen, city_id, visitDate } = useLocalSearchParams();
  const createPostRef = useRef<CreatePostButtonHandle>(null);

  const [region, setRegion] = useState<Region>()
  const [cities, setCities] = useState<Cities>([])
  const [posts, setPosts] = useState<Posts>([])
  const [selectedCityId, setSelectedCityId] = useState<string>('all')

  /**
   * Fetch region details by ID.
   */
  const fetchRegion = async () => {
    try {
      const regionData = await api.destinations.getRegionById(region_id as string)
      setRegion(regionData)
    } catch (error) {
      console.error('Error fetching region:', error)
    }
  }

  /**
   * Fetch all cities belonging to this region.
   */
  const fetchCities = async () => {
    try {
      const cities = await api.destinations.getCitiesByRegion(region_id as string)
      setCities(cities)
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  /**
   * Fetch all posts for this region, sort most recent first.
   */
  const fetchPosts = async () => {
    try {
      const posts = await api.forum.getPostsByRegionId(region_id as string)
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPosts(posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  /**
   * Load data when screen comes into focus.
   */
  useEffect(() => {
    fetchRegion()
    fetchCities()
    fetchPosts()
  }, [])

  /**
   * Filter posts by selectedCityId.
   * 'all' means no filtering.
   */
  const filteredPosts = selectedCityId === 'all'
    ? posts
    : posts.filter((post) => post.city_id === selectedCityId)

  return (
    <View className="flex-1 relative">

      {/* Header with region title & description */}
      <View className="bg-white p-4 shadow-sm">
        <Text className="text-2xl font-bold">{region?.name}</Text>
        <Text className="text-sm text-gray-500">{region?.description}</Text>

        {/* City filter */}
        <View className="mt-2">
          <Text className="text-sm font-bold text-gray-600 mb-1">Filter by City</Text>
          <Picker
            selectedValue={selectedCityId}
            onValueChange={(value) => setSelectedCityId(value)}
            style={{ backgroundColor: '#f4f4f5' }}
          >
            <Picker.Item label="All Cities" value="all" />
            {cities.map((city) => (
              <Picker.Item key={city.id} label={city.city_name} value={city.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Posts list */}
      <View className="flex-1">
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-8">No posts found for this city.</Text>
          }
        />
      </View>

      {/* Button to create new posts */}
      <CreatePostButton
        ref={createPostRef}
        region_id={region_id as string}
        onPostCreated={fetchPosts}
        autoOpen={autoOpen === 'true'}
        initialCityId={city_id as string}
        initialDate={visitDate as string}
      />
    </View>
  )
}

export default RegionForum
