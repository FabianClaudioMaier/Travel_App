// components/MaximalPrice.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface MaximalPriceProps {
  /** Aktueller maximaler Preis (in Euro) */
  maxPrice: number;
  /**
   * Wird aufgerufen, wenn sich der Preis ändern soll.
   * @param newPrice der neue Preis (in Euro)
   */
  onChange: (newPrice: number) => void;
}

const PRICE_OPTIONS = [100, 200, 500, 1000, 2000];

export default function MaximalPrice({ maxPrice, onChange }:MaximalPriceProps ) {
  return (
    <View className="p-4 items-center w-full">
      {/* Erläuterungstexte */}
      <Text className="text-base font-bold text-gray-500 text-center mb-2">
        The total price of the journey should not exceed this price*
      </Text>

      {/* manueller Wert */}
      <View className="flex-row items-center gap-4 mb-4">
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChange(Math.max(0, maxPrice - 100))}
        >
          <FontAwesome name="minus" size={24} color="black" />
        </TouchableOpacity>        
        <Text className="text-5xl font-bold mx-2">{maxPrice}</Text>
        <Text className="text-5xl font-bold">€</Text>
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChange(maxPrice + 100)}
        >
          <FontAwesome name="plus" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Preset-Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row flex-wrap justify-left mb-4"
      >
        {PRICE_OPTIONS.map(p => (
          <TouchableOpacity
            key={p}
            className='px-2 py-1 border-2 border-black rounded-lg mr-2'
            style={{ backgroundColor: maxPrice === p ? 'black' : 'white' }}
            onPress={() => onChange(p)}
          >
            <Text className="text-base font-bold" style={{ color: maxPrice === p ? 'white' : 'black' }}>
              {p.toLocaleString()} €
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text className="text-sm text-gray-500 text-center mb-1 w-[300px]">
        *If we are unable to find a fitting trip, we will show you the cheapest result.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});