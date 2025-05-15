import { Cities, City, Region } from '@/interfaces/destinations'
import api from '@/services/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Image, Text, View } from 'react-native'
import CityCard from '@/components/community/CityCard'

const CityForum = () => {
  const { city_id } = useLocalSearchParams()
  const [city, setCity] = useState<City>()

  const fetchCity = async () => {
    const city = await api.destinations.getCityById(city_id as string)
    setCity(city)
  }

  useEffect(() => {
    fetchCity()
  }, [])

  return (
    <View className="flex-1">
      <Text>City Forum</Text>
      <Text>{city?.city_name}</Text>
    </View>
  )
}

export default CityForum