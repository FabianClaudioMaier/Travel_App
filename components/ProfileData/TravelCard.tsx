/* TravelCard.tsx */
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { TravelRecord } from '@/interfaces/destinations';

const TravelCard: React.FC<{ item: TravelRecord }> = ({ item }) => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCityImage = async () => {
      if (item.stops?.length) {
        try {
          const city = await api.destinations.getCityById(item.stops[0]);
          setImageUrl((city as any).image_url || (city as any).imageUrl || null);
        } catch {
          console.error('Error fetching city image');
        }
      }
      setLoading(false);
    };
    fetchCityImage();
  }, [item.stops]);

  const handleOpen = () => {
    console.log('[TravelCard] Opening saved travel:', item);
    router.push({
      pathname: '/result',
      params: {
        id: item.id.toString(),
      }
    });
  };

  const handlePublish = async () => {
    if (!item.stops?.length) return;
    try {
      const city = await api.destinations.getCityById(item.stops[0]);
      const region_id = (city as any).region_id || (city as any).regionId;
      if (region_id) {
        router.push({
          pathname: '/community/[region_id]',
          params:    { region_id },
          search:    {
            autoOpen: 'true',
            city_id:  item.stops[0],
            visitDate: item.start_date,
          },
        });
      }
    } catch (err) {
      console.error('Error navigating to community', err);
    }
  };

  const start = new Date(item.start_date).toLocaleDateString();
  const end = new Date(item.end_date).toLocaleDateString();
  const title = [item.origin, ...item.stops, item.destination].join(' → ');

  return (
    <View style={styles.card}>
      {loading ? (
       <View style={[styles.imageIcon, styles.loader]}>
          <ActivityIndicator />
        </View>
      ) : (
        <Image style={styles.imageIcon} source={imageUrl ? { uri: imageUrl } : null} />
      )}
      <View style={styles.info}>
        <Text style={[styles.text, styles.textTypo]} numberOfLines={1}>{`${start} - ${end}`}</Text>
        <Text style={[styles.destinationText, styles.text1Clr]} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.pill} onPress={handleOpen}><Text style={styles.label}>Open</Text></TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={handlePublish}><Text style={styles.label}>Publish to Community</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { justifyContent: 'center', gap: 12, width: '100%', marginBottom: 16 },
  imageIcon: { borderRadius: 8, height: 200, width: '100%' },
  loader: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  info: { gap: 2, marginTop: 8 },
  textTypo: { fontFamily: 'Inter-Regular', paddingHorizontal: 10 },
  text: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },
  destinationText: { fontSize: 14, paddingHorizontal: 10 },
  text1Clr: { color: '#000' },
  buttonsRow: { flexDirection: 'row', gap: 8, marginLeft: 10 },
  pill: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderWidth: 2, borderColor: '#e6e6e6', borderRadius: 6 },
  label: { fontSize: 14, color: '#1a1a1a' },
});
export default TravelCard;