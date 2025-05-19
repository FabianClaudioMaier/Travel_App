/* ProfileScreen.tsx (angepasst) */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
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
import TravelCard, { TravelRecord } from '@/components/ProfileData/TravelCard';
import { useFocusEffect } from '@react-navigation/native';


export default function ProfileScreen() {
  const [travels, setTravels] = useState<TravelRecord[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadTravels = async () => {
        try {
          const json = await AsyncStorage.getItem('myTravels');
          const list: TravelRecord[] = json ? JSON.parse(json) : [];
          setTravels(list);
        } catch (e) {
          console.warn('Failed to load travels', e);
        }
      };

      loadTravels();
    }, [])
  );

  const renderItem = ({ item }: { item: TravelRecord }) => {
    if (!item.start_date || !item.end_date) return null;
    return (
      <TravelCard
        item={item}
      />
    );
  };

  return (
    <FlatList
      data={travels}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.empty}>No saved travels yet.</Text>}
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
          <Text style={styles.header}>My Travels</Text>
        </View>
      )}
      contentContainerStyle={travels.length === 0 ? styles.container : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 10, margin: 20, backgroundColor: '#000', width: '80%' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
  headerWrapper: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 16,
  },
});
