import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import api from '@/services/api'
import { Regions } from '@/interfaces/destinations'
import RegionCard from '@/components/community/RegionCard'


/**
 * CommunityIndex
 * Fetches and displays a list of regions in the community.
 */
const CommunityIndex = () => {
  const [regions, setRegions] = useState<Regions>()

    /**
     * fetchRegions
     * Retrieves all regions from the API and updates state.
     * Wrapped in useCallback so the function identity is stable.
     */
    const fetchRegions = async () => {
        try {
            const regions = await api.destinations.getAllRegions()
            setRegions(regions)
        } catch (error) {
            console.error('Error fetching regions:', error)
        }
    }
    // Load regions once when the component mounts
    useEffect(() => {
        fetchRegions()
    }, [])


  /**
   * Renders a single RegionCard given a region item.
   */
  return (
    <View className="flex-1">
      <View className="bg-white p-4 shadow-md">
        <Text className="text-2xl font-bold">Community</Text>
      </View>
      <FlatList
            data={regions}
            renderItem={({ item }) => (
                <RegionCard region={item} />
            )}
            keyExtractor={(item) => item.id.toString()}
        />
    </View>
  )
}

export default CommunityIndex

const styles = StyleSheet.create({})