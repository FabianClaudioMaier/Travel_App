import React, { FC, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Profile sub-components for displaying/editing user info
import ProfileImage from '@/components/ProfileData/ProfileImage';
import ProfileName from '@/components/ProfileData/ProfileName';
import ProfileEmail from '@/components/ProfileData/ProfileEmail';
import ProfilePassword from '@/components/ProfileData/ProfilePassword';
import ProfileHometown from '@/components/ProfileData/ProfileHometown';
import ProfileAnonymousmode from '@/components/ProfileData/ProfileAnonymousmode';
import ProfileServices from '@/components/ProfileData/ProfileServices';
import ProfileTransportation from '@/components/ProfileData/ProfileTransportation';

// TravelCard and its associated record type
import TravelCard, { TravelRecord } from '@/components/ProfileData/TravelCard';

/**
 * ProfileScreen displays user profile info and saved travels.
 * Uses AsyncStorage to load saved travel records on focus.
 */
const ProfileScreen: FC = () => {
  // Local state: list of saved travels
  const [travels, setTravels] = useState<TravelRecord[]>([]);

  // Router for navigation if needed
  const router = useRouter();

  /**
   * Load travels from AsyncStorage whenever the screen gains focus.
   * Wrapped in useFocusEffect to reload on return from other screens.
   */
  useFocusEffect(
    useCallback(() => {
      // Async function to fetch stored travels
      const loadTravels = async () => {
        try {
          const json = await AsyncStorage.getItem('myTravels');
          // Parse JSON into TravelRecord array or fallback to empty
          const list: TravelRecord[] = json ? JSON.parse(json) : [];
          setTravels(list);
        } catch (error) {
          // Warn on failure but keep screen functional
          console.warn('Failed to load travels', error);
        }
      };

      loadTravels();
    }, []),
  );

  /**
   * Render each saved travel as a TravelCard.
   * Filters out records missing dates.
   */
  const renderItem = useCallback(
    ({ item }: { item: TravelRecord }) => {
      if (!item.start_date || !item.end_date) {
        // Skip records without valid date range
        return null;
      }
      return <TravelCard item={item} />;
    },
    [],
  );

  return (
    <FlatList
      data={travels}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      // Shown when there are no saved travels
      ListEmptyComponent={
        <Text style={styles.empty}>No saved travels yet.</Text>
      }
      // Header component contains profile fields and title
      ListHeaderComponent={() => (
        <View style={styles.headerWrapper}>
          <Text style={styles.header}>My Profile</Text>

          {/* Profile fields: image, name, email, etc. */}
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
      // Center empty state text when no data
      contentContainerStyle={
        travels.length === 0 ? styles.emptyContainer : undefined
      }
    />
  );
};

/**
 * Styles for ProfileScreen components.
 */
const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerWrapper: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ProfileScreen;
