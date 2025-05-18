import { FontAwesome6 } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const TABS = [
  {
    key: 'train',
    label: 'Train',
  },
  {
    key: 'bus',
    label: 'Bus',
  },
  {
    key: 'plane',
    label: 'Plane',
  },
]

const ResultsRoutes = () => {
  const [selectedTab, setSelectedTab] = useState('plane')

  return (
    <View className='flex-1 bg-white'>
      <View className='flex-row justify-between items-center bg-gray-200 w-full'>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 items-center justify-center p-4 ${idx === 0 ? 'border-r border-gray-300' : idx === 2 ? 'border-l border-gray-300' : 'border-r border-gray-300'}`}
            style={selectedTab === tab.key ? { borderBottomWidth: 4, borderBottomColor: '#F87171', backgroundColor: '#fff' } : {}}
            onPress={() => setSelectedTab(tab.key)}
            activeOpacity={0.7}
          >
            <View className='flex-row items-center justify-center gap-2'>
              <FontAwesome6 name={tab.key} size={24} color="black" />
              <Text className='text-black text-lg font-bold'>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {/* You can show more details for the selected tab below if needed */}
      <View className='flex-1 items-center justify-center'>
        <Text style={{ fontSize: 18, color: '#64748b' }}>Selected: {TABS.find(t => t.key === selectedTab)?.label}</Text>
      </View>
    </View>
  )
}

export default ResultsRoutes

const styles = StyleSheet.create({})