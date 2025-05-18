import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ListRenderItemInfo,
  ScrollView,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import ProfileImage from '@/components/ProfileData/ProfileImage';
import ProfileName from '@/components/ProfileData/ProfileName';
import ProfileEmail from '@/components/ProfileData/ProfileEmail';
import ProfilePassword from '@/components/ProfileData/ProfilePassword';
import ProfileHometown from '@/components/ProfileData/ProfileHometown';
import ProfileAnonymousmode from '@/components/ProfileData/ProfileAnonymousmode';
import ProfileServices from '@/components/ProfileData/ProfileServices';
import ProfileTransportation from '@/components/ProfileData/ProfileTransportation';

interface TravelRecord {
  id: string;
  origin: string;
  stops: string[];
  destination: string;
  modes?: string[];
  start_date?: string;
  end_date?: string;
  price?: number;
}

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [travels, setTravels] = useState<TravelRecord[]>([]);
  const router = useRouter();

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
  }, []);

  const renderItem = ({ item }: ListRenderItemInfo<TravelRecord>) => {

      if (!item.start_date || !item.end_date) {
        return null;
      }

    const title = [item.origin, ...item.stops, item.destination].join(' → ');
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/result',
            params: { id: item.id },
          })
        }
      >
        <Text style={styles.title}>{title}</Text>
        <Text>{`Reisedaten: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={travels}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListEmptyComponent={
          <Text style={styles.empty}>No saved travels yet.</Text>
      }
      ListHeaderComponent={() => (
        <View style={styles.headerWrapper}>
          <Text style={styles.header}>My Profile</Text>
          <ProfileImage />
          <ProfileName />
          <ProfileEmail />
          <ProfilePassword />
          <ProfileHometown />
          <ProfileAnonymousmode />
          <ProfileServices />
          <ProfileTransportation />
          <Text style={styles.header}>My Travels</Text>
        </View>
      )}
      contentContainerStyle={
        travels.length === 0 ? styles.container : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {padding: 10, margin: 20, backgroundColor: '#000', width: '80%' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign:'center' },
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
  headerWrapper: {
    width: '90%',
    alignSelf: 'center', // zentriert horizontal
    paddingVertical: 16,
  },
});