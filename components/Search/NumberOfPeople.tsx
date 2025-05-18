// components/NumberOfPeople.js
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

export interface NumberOfPeopleProps {
  /** Aktuelle Anzahl der Erwachsenen */
  numberOfAdults: number;
  /**
   * Callback, wenn sich die Anzahl der Erwachsenen ändern soll.
   * @param newCount die neue Anzahl der Erwachsenen
   */
  onChangeNumberOfAdults: (newCount: number) => void;
  /** Aktuelle Anzahl der Kinder (12 Jahre oder jünger) */
  numberOfChildren: number;
  /**
   * Callback, wenn sich die Anzahl der Kinder ändern soll.
   * @param newCount die neue Anzahl der Kinder
   */
  onChangeNumberOfChildren: (newCount: number) => void;
}

export default function MaximalPrice({ numberOfAdults, onChangeNumberOfAdults, numberOfChildren, onChangeNumberOfChildren }:NumberOfPeopleProps ) {
  return (
    <View className="items-center p-4">
      {/* Erläuterungstexte */}
      <Text className="text-base font-bold opacity-70 text-center mb-1 w-[300px]">
        Adults
      </Text>

      {/* manueller Wert */}
      <View className="flex flex-row items-center mb-3 gap-5">
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChangeNumberOfAdults(Math.max(0, numberOfAdults - 1))}
        >
          <FontAwesome name="minus" size={36} color="black" />
        </TouchableOpacity>
        <Text className="text-5xl font-bold mx-2">{numberOfAdults}</Text>
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChangeNumberOfAdults(numberOfAdults + 1)}
        >
          <FontAwesome name="plus" size={36} color="black" />
        </TouchableOpacity>
      </View>

      {/* Erläuterungstexte */}
      <Text className="text-base font-bold opacity-70 text-center mb-1 w-[300px]">
        Children
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-1 w-[300px]">
        12 Years or Younger
      </Text>

      {/* manueller Wert */}
      <View className="flex flex-row items-center mb-3 gap-5">
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChangeNumberOfChildren(Math.max(0, numberOfChildren - 1))}
        >
          <FontAwesome name="minus" size={36} color="black" />
        </TouchableOpacity>
        <Text className="text-5xl font-bold mx-2">{numberOfChildren}</Text>
        <TouchableOpacity
          className="w-[70px] h-[60px] rounded-lg border-2 border-black justify-center items-center mx-2 bg-[#f0f0f0]"
          onPress={() => onChangeNumberOfChildren(numberOfChildren + 1)}
        >
          <FontAwesome name="plus" size={36} color="black" />
        </TouchableOpacity>
        
      </View>



    </View>
  );
}

const styles = StyleSheet.create({});