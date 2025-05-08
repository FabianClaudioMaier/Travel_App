// ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [travels, setTravels] = useState([]);
  const isFocused = useIsFocused();
  const nav = useNavigation();

  useEffect(() => {
    (async () => {
      try {
        const json   = await AsyncStorage.getItem('myTravels');
        const list   = json ? JSON.parse(json) : [];
        setTravels(list);
      } catch (e) {
        console.warn('Failed to load travels', e);
      }
    })();
  }, [isFocused]);

  const renderItem = ({ item }) => {
    // Deine gespeicherten Felder
    const {
      origin,
      stops,
      destination,
      label,
      durationSec,
      distanceKm,
      route,        // falls du das Ganze nochmal brauchst
      modes,        // ggf. übergeben
      start_date,   // ggf. übergeben
      end_date      // ggf. übergeben
    } = item;

    // Fallbacks: falls durationSec oder distanceKm nicht existieren,
    // versuche alternative Keys, sonst 0
    const duration = typeof durationSec === 'number'
      ? durationSec
      : typeof item.duration === 'number'
        ? item.duration
        : 0;

    const distance = typeof distanceKm === 'number'
      ? distanceKm
      : typeof item.distance === 'number'
        ? item.distance
        : // letzter Fallback: vielleicht hast du route.distanceMeters?
        (route && typeof route.distanceMeters === 'number'
          ? route.distanceMeters / 1000
          : 0
        );

    // Titel-Text
    const title = [origin, ...stops, destination].join(' → ');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          // Hier übergibst du alles, was deine ResultScreen braucht:
          nav.navigate('HomeTab', {
            screen: 'Result',
            params: {
                origin,
                stops,
                destination,
                modes,
                start_date,
                end_date
              }
          })
        }
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {label}: {Math.floor(duration / 3600)}h{' '}
          {Math.floor((duration % 3600) / 60)}m,{' '}
          {distance.toFixed(1)} km
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyTravels</Text>
      <FlatList
        data={travels}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved travels yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header:    { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card:      {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1
  },
  title:     { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta:      { fontSize: 14, color: '#555' },
  empty:     { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});
