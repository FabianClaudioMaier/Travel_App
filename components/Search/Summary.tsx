import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

interface SummaryProps {
  numberOfAdults: number;
  numberOfChildren: number;
  startDate: Date;
  endDate: Date;
  cities: string[];
  maxPrice: number;
  modes: string[];
}

export default function Summary({
  numberOfAdults,
  numberOfChildren,
  startDate,
  endDate,
  cities,
  maxPrice,
  modes,
}: SummaryProps) {


  return (
    <View className="p-4">
      <Text className="text-2xl font-bold text-center mb-2">Your Journey:</Text>

      <View className="flex-row items-center mb-2 gap-2">
        <View className="w-10 h-6 items-center justify-center">
          <FontAwesome name="map-marker" size={20}/>
        </View>
        <Text className="ml-2 text-lg font-bold">{cities.join(', ')}</Text>
      </View>
      <View className="flex-row items-center mb-2 gap-2">
        <View className="w-10 h-6 items-center justify-center">
          <FontAwesome name="user" size={20}/>
        </View>
        <Text className="ml-2 text-lg font-bold">{numberOfAdults} Adults, {numberOfChildren} Children</Text>
      </View>
      <View className="flex-row items-center mb-2 gap-2">
        <View className="w-10 h-6 items-center justify-center">
          <FontAwesome name="calendar" size={20}/>
        </View>
        <Text className="ml-2 text-lg font-bold">
          {startDate.toLocaleDateString('de-DE', { month: 'long', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString('de-DE', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <View className="flex-row items-center mb-2 gap-2">
        <View className="w-10 h-6 items-center justify-center">
          <FontAwesome name="money" size={20}/>
        </View>
        <Text className="ml-2 text-lg font-bold">Max. € {maxPrice.toLocaleString()}</Text>
      </View>
      <View className="flex-row items center mb-2 gap-2">
        <View className="w-10 h-6 items-center justify-center">
          <FontAwesome name="plane" size={20}/>
        </View>
        <Text className="ml-2 text-lg font-bold">{modes.join(', ')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

});
