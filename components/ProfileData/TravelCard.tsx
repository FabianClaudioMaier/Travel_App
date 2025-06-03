import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { TravelRecord } from '@/interfaces/destinations';

// Props for the TravelCard component
interface Props {
  item: TravelRecord; // Travel record data including stops, dates, and locations
}

/**
 * TravelCard component displays a summary card for a saved travel itinerary.
 * - Fetches and shows an image for the first stop's city.
 * - Displays travel dates and route.
 * - Provides actions to open the itinerary or view the related community.
 */
const TravelCard: React.FC<Props> = ({ item }) => {
  const router = useRouter();

  // State to hold the fetched city image URL
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // State to track loading status of the image fetch
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetches the image URL for the first stop in the travel record.
   * Updates imageUrl and loading state accordingly.
   */
  useEffect(() => {
    const fetchCityImage = async () => {
      // Only attempt fetch if there is at least one stop
      if (item.stops?.length) {
        try {
          // Retrieve city details by its ID
          const city = await api.destinations.getCityById(item.stops[0]);
          // Prefer image_url, fallback to imageUrl, or null if missing
          setImageUrl((city as any).image_url || (city as any).imageUrl || null);
        } catch (error) {
          console.error('Error fetching city image', error);
        }
      }
      // Mark loading as complete regardless of fetch result
      setLoading(false);
    };

    fetchCityImage();
  }, [item.stops]);

  /**
   * Handler for opening the detailed travel result screen.
   * Navigates to '/result' and passes the travel ID as a parameter.
   */
  const handleOpen = () => {
    console.log('[TravelCard] Opening saved travel:', item);
    router.push({
      pathname: '/',
      params: {
        id: item.id.toString(),
      },
    });
  };

  /**
   * Handler for navigating to the community view related to the first stop's region.
   * Retrieves region_id from the city data and navigates with query params.
   */
  const handlePublish = async () => {
    // Do nothing if there are no stops
    if (!item.stops?.length) return;

    try {
      const city = await api.destinations.getCityById(item.stops[0]);
      const region_id = (city as any).region_id || (city as any).regionId;

      // Only navigate if a valid region_id is available
      if (region_id) {
        router.push({
          pathname: '/community/[region_id]',
          params: { region_id },
          search: {
            autoOpen: 'true',      // Open community modal automatically
            city_id: item.stops[0],
            visitDate: item.start_date,
          },
        });
      }
    } catch (err) {
      console.error('Error navigating to community', err);
    }
  };

  // Format travel start and end dates for display
  const start = new Date(item.start_date).toLocaleDateString();
  const end = new Date(item.end_date).toLocaleDateString();
  // Construct a route title string, e.g., "Origin → Stop1 → Destination"
  const title = [item.origin, ...item.stops, item.destination].join(' → ');

  return (
    <View style={styles.card}>
      {loading ? (
        // Show a loading spinner while fetching the image
        <View style={[styles.imageIcon, styles.loader]}>
          <ActivityIndicator />
        </View>
      ) : (
        // Display the fetched image if available
        <Image style={styles.imageIcon} source={imageUrl ? { uri: imageUrl } : null} />
      )}

      {/* Display travel dates and route title */}
      <View style={styles.info}>
        <Text style={[styles.text, styles.textTypo]} numberOfLines={1}>
          {`${start} - ${end}`}
        </Text>
        <Text style={[styles.destinationText, styles.text1Clr]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Action buttons: Open detail or view community */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.pill} onPress={handleOpen}>
          <Text style={styles.label}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={handlePublish}>
          <Text style={styles.label}>See the Community</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Stylesheet for TravelCard component
const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  imageIcon: {
    borderRadius: 8,
    height: 200,
    width: '100%',
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  info: {
    gap: 2,
    marginTop: 8,
  },
  textTypo: {
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  destinationText: {
    fontSize: 16,
    paddingHorizontal: 10,
  },
  text1Clr: {
    color: '#000',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 20,
    marginLeft: 10,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#000',
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    color: '#fff',
  },
});

export default TravelCard;
