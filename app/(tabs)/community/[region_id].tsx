import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreatePostButton, { CreatePostButtonHandle } from '@/components/community/forum/CreatePostButton';
import PostCard from '@/components/community/forum/PostCard';
import { Cities, Region } from '@/interfaces/destinations';
import { Posts } from '@/interfaces/forum';
import api from '@/services/api';
import { useLocalSearchParams } from 'expo-router';

const RegionForum = () => {
  const { region_id, autoOpen, city_id, visitDate } = useLocalSearchParams();
  const createPostRef = useRef<CreatePostButtonHandle>(null);

  const [region, setRegion] = useState<Region>();
  const [cities, setCities] = useState<Cities>([]);
  const [posts, setPosts] = useState<Posts>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('all');

  useEffect(() => {
    fetchRegion();
    fetchCities();
    fetchPosts();
  }, []);

  const fetchRegion = async () => {
    try {
      const regionData = await api.destinations.getRegionById(region_id as string);
      setRegion(regionData);
    } catch (error) {
      console.error('Error fetching region:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const cities = await api.destinations.getCitiesByRegion(region_id as string);
      setCities(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const posts = await api.forum.getPostsByRegionId(region_id as string);
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const filteredPosts =
    selectedCityId === 'all'
      ? posts
      : posts.filter((post) => post.city_id === selectedCityId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.regionName}>{region?.name}</Text>
          <Text style={styles.regionDescription}>{region?.description}</Text>

          {/*<View style={styles.pickerContainer}>
            <Text style={styles.filterLabel}>Filter by City</Text>
            <Picker
              selectedValue={selectedCityId}
              onValueChange={(value) => setSelectedCityId(value)}
              style={Platform.OS === 'ios' ? styles.iosPicker : styles.androidPicker}
            >
              <Picker.Item label="All Cities" value="all" />
              {cities.map((city) => (
                <Picker.Item key={city.id} label={city.city_name} value={city.id} />
              ))}
            </Picker>
          </View>*/}
        </View>

        {/* Post List */}
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts found for this city.</Text>
          }
        />

        {/* Floating Button */}
        <CreatePostButton
          ref={createPostRef}
          region_id={region_id as string}
          onPostCreated={fetchPosts}
          autoOpen={autoOpen === 'true'}
          initialCityId={city_id as string}
          initialDate={visitDate as string}
        />
      </View>
    </SafeAreaView>
  );
};

export default RegionForum;

// === Styles ===
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  regionName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  regionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },

  androidPicker: {
    backgroundColor: '#f4f4f5',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
    fontSize: 16,
  },
});
