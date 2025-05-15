import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import api from '@/services/api'
import { Regions } from '@/interfaces/destinations'
import RegionCard from '@/components/community/RegionCard'

const CommunityIndex = () => {
  const [regions, setRegions] = useState<Regions>()

    const fetchRegions = async () => {
        try {
            const regions = await api.destinations.getAllRegions()
            setRegions(regions)
        } catch (error) {
            console.error('Error fetching regions:', error)
        }
    }
    useEffect(() => {
        fetchRegions()
    }, [])
    
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