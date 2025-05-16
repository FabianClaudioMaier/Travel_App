import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useIsFocused,
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import ProfileImage from '@/components/ProfileData/ProfileImage';
import ProfileName from '@/components/ProfileData/ProfileName';
import ProfileEmail from '@/components/ProfileData/ProfileEmail';
import ProfilePassword from '@/components/ProfileData/ProfilePassword';
import ProfileHometown from '@/components/ProfileData/ProfileHometown';
import ProfileAnonymousmode from '@/components/ProfileData/ProfileAnonymousmode';
import ProfileServices from '@/components/ProfileData/ProfileServices';
import ProfileTransportation from '@/components/ProfileData/ProfileTransportation';


// --- Typen für gespeicherte Reisen ---
interface TravelRecord {
  origin: string;
  stops: string[];
  destination: string;
  modes?: string[];
  start_date?: string;
  end_date?: string;
  label?: string;
  durationSec?: number;
  distanceKm?: number;
  duration?: number;
  distance?: number;
  route?: { distanceMeters?: number };
}

// Navigation-Typ (ggf. genauer spezifizieren)
type ProfileScreenNavProp = NavigationProp<any>;

export default function ProfileScreen() {
  const [travels, setTravels] = useState<TravelRecord[]>([]);
  const isFocused = useIsFocused();
  const navigation = useNavigation<ProfileScreenNavProp>();

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem('myTravels');
        const list: TravelRecord[] = json ? JSON.parse(json) : [];
        setTravels(list);
      } catch (e) {
        console.warn('Failed to load travels', e);
      }
    })();
  }, [isFocused]);

  const renderItem = ({ item }: ListRenderItemInfo<TravelRecord>) => {
    const {
      origin,
      stops,
      destination,
      label,
      durationSec,
      distanceKm,
      duration,
      distance,
      route,
      modes,
      start_date,
      end_date,
    } = item;

    const dur =
      typeof durationSec === 'number'
        ? durationSec
        : typeof duration === 'number'
        ? duration
        : 0;
    const dist =
      typeof distanceKm === 'number'
        ? distanceKm
        : typeof distance === 'number'
        ? distance
        : route && typeof route.distanceMeters === 'number'
        ? route.distanceMeters / 1000
        : 0;

    const title = [origin, ...stops, destination].join(' → ');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('HomeTab', {
            screen: 'Result',
            params: { origin, stops, destination, modes, start_date, end_date },
          })
        }
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {label}: {Math.floor(dur / 3600)}h {Math.floor((dur % 3600) / 60)}m, {dist.toFixed(1)} km
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyTravels</Text>
      <ProfileImage/>
      <ProfileName/>
      <ProfileEmail/>
      <ProfilePassword/>
      <ProfileHometown/>
      <ProfileAnonymousmode/>
      <ProfileTransportation/>
      <FlatList
        data={travels}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No saved travels yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14, color: '#555' },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});
