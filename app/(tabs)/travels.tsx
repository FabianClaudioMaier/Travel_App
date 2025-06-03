// app/travels.tsx

import React, { FC, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import TravelCard, { TravelRecord } from '@/components/ProfileData/TravelCard';

const TravelsScreen: FC = () => {
  const [travels, setTravels] = useState<TravelRecord[]>([]);

  // Beim Fokus den gespeicherten Key "myTravels" aus AsyncStorage laden
  useFocusEffect(
    useCallback(() => {
      const loadTravels = async () => {
        try {
          const json = await AsyncStorage.getItem('myTravels');
          const list: TravelRecord[] = json ? JSON.parse(json) : [];
          setTravels(list);
        } catch (error) {
          console.warn('Failed to load travels', error);
        }
      };
      loadTravels();
    }, []),
  );

  // Render-Funktion: Nur Datensätze mit gültigen Dates anzeigen
  const renderItem = useCallback(
    ({ item }: { item: TravelRecord }) => {
      if (!item.start_date || !item.end_date) {
        return null;
      }
      return <TravelCard item={item} />;
    },
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Travels</Text>
      <FlatList
        data={travels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No travels saved yet</Text>
        }
        contentContainerStyle={
          travels.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  empty: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TravelsScreen;
