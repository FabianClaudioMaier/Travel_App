import React, { useEffect, useState, FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Polyline, Marker, LatLng } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import CityCard from '@/components/community/CityCard';
import RegionSwiper from '@/components/RegionSwiper';
import Header from '@/components/Result/Header';
import { City } from '@/interfaces/destinations';
import { TransitRoute } from '@/interfaces/routes';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Preloaded airport coordinates for flight routing
const airportCoordinates: Record<string, LatLng> = require('../../data/airportCoordinates.json');
const { width } = Dimensions.get('window');

/**
 * Calculates great-circle distance between two points
 * using the haversine formula. Returns kilometers.
 */
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aCalc = sinDLat ** 2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon ** 2;

  return R * 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
}

/**
 * Decodes Google-encoded polyline into an array of LatLng
 */
function decodePolyline(encoded: string): LatLng[] {
  // If JSON array, parse directly
  if (encoded.trim().startsWith('[')) {
    try {
      return JSON.parse(encoded) as LatLng[];
    } catch {
      // Fall back to manual decode
    }
  }

  const coords: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;

    // Decode latitude offset
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    // Decode longitude offset
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coords;
}

/**
 * Converts duration strings like "2h30m" or numbers to seconds
 */
const toSeconds = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : Infinity;
};

/**
 * Utility to unwrap API responses returning objects containing arrays
 */
function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    for (const value of Object.values(raw)) {
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

// Types for transport info
interface LegInfo {
  duration: number;
  distanceMeters: number;
  encodedPolyline: string;
  price?: string;
}
type Mode = 'Bus' | 'Train' | 'Flight';

/**
 * Fetches bus or train routes from API
 */
async function fetchLegMode(
  type: 'buses' | 'trains',
  from: string,
  to: string,
): Promise<LegInfo[]> {
  try {
    const raw =
      type === 'buses'
        ? await api.routes.getBusRoutes(from, to)
        : await api.routes.getTrains(from, to);
    return unwrapArray<TransitRoute>(raw).map(r => ({
      duration: toSeconds(r.duration),
      distanceMeters: r.distanceMeters,
      encodedPolyline: r.polyline.encodedPolyline,
    }));
  } catch {
    // Return empty if API fails
    return [];
  }
}

/**
 * Simulates flight route based on great-circle distance
 */
async function fetchFlights(
  fromCode: string,
  toCode: string,
): Promise<LegInfo[]> {
  const origin = airportCoordinates[fromCode];
  const dest = airportCoordinates[toCode];
  if (!origin || !dest) return [];

  const distanceKm = haversineDistance(origin, dest);
  // Assume average speed 900km/h + 3h total ground time
  const durationSec = (distanceKm / 900) * 3600 + 3 * 3600;

  return [
    {
      duration: Math.round(durationSec),
      distanceMeters: Math.round(distanceKm * 1000),
      // Direct line from origin to destination
      encodedPolyline: JSON.stringify([origin, dest]),
    },
  ];
}

/**
 * Chooses the fastest transport mode among buses, trains, flights
 */
async function getBestLeg(
  fromCity: string,
  toCity: string,
  fromAirport: string,
  toAirport: string,
  modes: string[],
  cities: City[],
): Promise<{ mode: Mode; info: LegInfo } | null> {
  const candidates: Array<{ mode: Mode; info: LegInfo }> = [];

  // Bus
  if (modes.includes('bus')) {
    const routes = await fetchLegMode('buses', fromCity, toCity);
    const city = cities.find(c => c.city_name === toCity);
    const price = city?.price?.bus
      ? `~€${city.price.bus.min}–${city.price.bus.max}`
      : 'N/A';
    routes.forEach(info => candidates.push({ mode: 'Bus', info: { ...info, price } }));
  }

  // Train
  if (modes.includes('train')) {
    const routes = await fetchLegMode('trains', fromCity, toCity);
    const city = cities.find(c => c.city_name === toCity);
    const price = city?.price?.train
      ? `~€${city.price.train.min}–${city.price.train.max}`
      : 'N/A';
    routes.forEach(info => candidates.push({ mode: 'Train', info: { ...info, price } }));
  }

  // Flight
  if (modes.includes('flight') && fromAirport && toAirport) {
    const flights = await fetchFlights(fromAirport, toAirport);
    flights.forEach(info =>
      candidates.push({ mode: 'Flight', info: { ...info, price: `€${Math.round(info.distanceMeters / 1000)}` } }),
    );
  }

  if (!candidates.length) return null;
  // Return candidate with shortest duration
  return candidates.reduce((best, curr) =>
    curr.info.duration < best.info.duration ? curr : best,
  );
}

/**
 * Returns all permutations of an array
 */
function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((val, idx) =>
    permute(items.filter((_, j) => j !== idx)).map(sub => [val, ...sub]),
  );
}

interface LegCardProps {
  modes: Mode;
  duration: number;
  distanceMeters: number;
  originCity: string;
  destCity: string;
  date?: string;
  price?: string;
}

/**
 * Displays a summary card for each leg with link to search
 */
const LegCard: FC<LegCardProps> = ({ modes, duration, originCity, destCity, date, price }) => {
  // Calculate random start time for mockup
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const startHour = Math.floor(Math.random() * 24);
  const startMin = Math.floor(Math.random() * 60);
  const format = (num: number) => String(num).padStart(2, '0');
  const start = `${format(startHour)}:${format(startMin)}`;
  const endHour = (startHour + hours + ((startMin + mins) > 59 ? 1 : 0)) % 24;
  const endMin = (startMin + mins) % 60;
  const end = `${format(endHour)}:${format(endMin)}`;

  const handlePress = () => {
    const query = encodeURIComponent(`${modes} form ${originCity} to ${destCity}`);
    Linking.openURL(`https://www.google.com/search?q=${query}`).catch(console.error);
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <View style={styles.headerRow}>
        <Icon
          name={
            modes === 'Flight'
              ? 'airplane-outline'
              : modes === 'Bus'
              ? 'bus-outline'
              : 'train-outline'
          }
          size={24}
        />
        <Text style={styles.productName}>{`${modes} ${originCity} → ${destCity}`}</Text>
        {price && price !== 'N/A' && <Text style={styles.price}>{price}</Text>}
        <Icon name="open-outline" size={24} />
      </View>
      <View style={styles.timelineRow}>
        <Text style={styles.timeText}>{start}</Text>
        <Text style={styles.durationText}>{`${hours}h ${mins}m`}</Text>
        <Text style={styles.timeText}>{end}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Main screen component computing and displaying best route
 */
const ResultScreen: FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Local state hooks
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [originAirport, setOriginAirport] = useState<string>('');
  const [stops, setStops] = useState<string[]>([]);
  const [stopsAirport, setStopsAirport] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [priceLimit, setPriceLimit] = useState<number>(Infinity);
  const [region, setRegion] = useState<string>('');
  const [people, setPeople] = useState<number>(0);

  const [cards, setCards] = useState<LegCardProps[]>([]);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [markerCoords, setMarkerCoords] =
    useState<Array<{ coordinate: LatLng; label: string }>>([]);

  const [allCities, setAllCities] = useState<City[]>([]);
  const [cityDetails, setCityDetails] = useState<City[]>([]);

  // 1) Compute route on mount or params change
  useEffect(() => {
    if (!allCities.length) return;

    (async () => {
      setLoading(true);
      // Reset previous data
      setCards([]);
      setPolylineCoords([]);
      setMarkerCoords([]);

      // Extract input values either from stored travels or query params
      let originVal: string;
      let destVal: string;
      let stopsArr: string[];
      let modesArr: string[];

      if (params.id) {
        const stored = await AsyncStorage.getItem('myTravels');
        const records = stored ? JSON.parse(stored) : [];
        const record = records.find((r: any) => String(r.id) === String(params.id));
        if (record) {
          originVal = record.origin;
          destVal = record.destination;
          stopsArr = record.stops;
          modesArr = record.modes;
          setOrigin(record.origin);
          setDestination(record.destination);
          setOriginAirport(record.originAirport || '');
          setStops(record.stops || []);
          setStopsAirport(record.stopsAirport || []);
          setModes(record.modes || []);
          setStartDate(record.start_date ? new Date(record.start_date) : undefined);
          setEndDate(record.end_date ? new Date(record.end_date) : undefined);
          setPriceLimit(record.price || Infinity);
          setRegion(record.regionId || '');
          setPeople(record.people || 0);
        }
      } else {
        // Fall back to query parameters
        originVal = (params.origin as string) || '';
        destVal = (params.destination as string) || '';
        stopsArr = (params.stops as string)?.split(',') || [];
        modesArr = (params.modes as string)?.split(',') || [];
        setPeople(
          Number(params.numberOfAdults ?? 0) + Number(params.numberOfChildren ?? 0),
        );
        setOrigin(originVal);
        setDestination(destVal);
        setOriginAirport((params.originAirport as string) || '');
        setStops(stopsArr);
        setStopsAirport((params.stopsAirport as string)?.split(',') || []);
        setModes(modesArr);
        setStartDate(params.start_date ? new Date(params.start_date as string) : undefined);
        setEndDate(params.end_date ? new Date(params.end_date as string) : undefined);
        setPriceLimit(params.price ? Number(params.price) : Infinity);
        setRegion((params.regionId as string) || '');
      }

      // Generate permutations of stops to find minimal travel time
      const permutations = permute(stopsArr);
      let bestOverall: { legs: Array<{ mode: Mode; info: LegInfo }>; time: number } | null = null;

      for (const perm of permutations) {
        const seqCities = [originVal, ...perm, destVal];
        const seqAirports = [
          originAirport,
          ...perm.map((_, i) => stopsAirport[i] || ''),
          (params.destinationAirport as string) || '',
        ];

        let totalTime = 0;
        const legs: Array<{ mode: Mode; info: LegInfo }> = [];

        for (let i = 0; i < seqCities.length - 1; i++) {
          const leg = await getBestLeg(
            seqCities[i],
            seqCities[i + 1],
            seqAirports[i],
            seqAirports[i + 1],
            modesArr,
            allCities,
          );
          if (!leg) {
            totalTime = Infinity;
            break;
          }
          totalTime += leg.info.duration;
          legs.push(leg);
        }

        if (totalTime < (bestOverall?.time ?? Infinity)) {
          bestOverall = { legs, time: totalTime };
        }
      }

      // Prepare cards and map when best route is found
      if (bestOverall) {
        const cardData = bestOverall.legs.map((leg, idx) => ({
          modes: leg.mode,
          duration: leg.info.duration,
          distanceMeters: leg.info.distanceMeters,
          originCity: idx > 0 ? stopsArr[idx - 1] : originVal,
          destCity: idx < stopsArr.length ? stopsArr[idx] : destVal,
          date: startDate?.toLocaleDateString(),
          price: leg.info.price,
        }));

        const coords: LatLng[] = [];
        const markers: Array<{ coordinate: LatLng; label: string }> = [];

        bestOverall.legs.forEach((leg, idx, arr) => {
          if (leg.mode === 'Flight') {
            // Flight legs are straight lines
            const [pt1, pt2] = JSON.parse(leg.info.encodedPolyline);
            coords.push(pt1, pt2);
            markers.push(
              { coordinate: pt1, label: idx === 0 ? 'Origin' : `Stop ${idx}` },
              { coordinate: pt2, label: idx === arr.length - 1 ? 'Destination' : `Stop ${idx + 1}` },
            );
          } else {
            // Other modes may have curved path
            const segment = decodePolyline(leg.info.encodedPolyline);
            coords.push(...segment);
            markers.push(
              { coordinate: segment[0], label: idx === 0 ? 'Origin' : `Stop ${idx}` },
              { coordinate: segment[segment.length - 1], label: idx === arr.length - 1 ? 'Destination' : `Stop ${idx + 1}` },
            );
          }
        });

        setCards(cardData);
        setPolylineCoords(coords);
        setMarkerCoords(markers);
      }

      setLoading(false);
    })();
  }, [params.id, params.origin, params.destination, params.stops, params.modes, params.regionId, allCities]);

  // Fetch all available cities once
  useEffect(() => {
    api.destinations
      .getAllCities()
      .then(setAllCities)
      .catch(console.error);
  }, []);

  // Update city details for displaying CityCard under each leg
  useEffect(() => {
    const details = allCities.filter(city => stops.includes(city.city_name));
    setCityDetails(details);
  }, [allCities, stops]);

  // Display loading
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading route...</Text>
      </View>
    );
  }

/**
   * Compute map viewport to fit all polyline coordinates
   */
  const computeInitialRegion = () => {
    if (!polylineCoords.length) return undefined;
    const lats = polylineCoords.map(c => c.latitude);
    const lons = polylineCoords.map(c => c.longitude);

    // Determine bounding box
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    return {
      latitude: (minLat + maxLat) / 2, // center latitude
      longitude: (minLon + maxLon) / 2, // center longitude
      latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.2), // zoom with padding
      longitudeDelta: Math.max(0.05, (maxLon - minLon) * 1.2),
    };
  };

  return (
    <>
      {/* Header showing region, date, and traveler count */}
      <Header
        region={region || 'Start a new Search'}
        dateRange={
          startDate && endDate
            ? `${startDate.toLocaleDateString('de-DE')} – ${endDate.toLocaleDateString('de-DE')}`
            : 'Select a Region'
        }
        guests={people ? `${people} Travelers` : 'in the Homescreen'}
      />

      <View style={styles.container}>
        <ScrollView>
          {/* Render map if polyline data exists */}
          {polylineCoords.length > 0 && (
            <MapView
              style={styles.overallMap}
              initialRegion={computeInitialRegion()} // set map bounds
            >
              {/* Draw route polyline */}
              <Polyline
                coordinates={polylineCoords}
                strokeWidth={2}
                strokeColor="blue"
              />
              {/* Place markers at each segment start/end */}
              {markerCoords.map((marker, idx) => (
                <Marker
                  key={idx}
                  coordinate={marker.coordinate}
                  title={marker.label} // show label on tap
                />
              ))}
            </MapView>
          )}

          {/* Render a card for each leg, and city details under each */}
          {cards.map((card, idx) => (
            <React.Fragment key={idx}>
              <LegCard {...card} />
              {/* Show CityCard for intermediate stops */}
              {idx < cityDetails.length && (
                <CityCard city={cityDetails[idx]} />
              )}
            </React.Fragment>
          ))}

          {/* If no routes, show Home button and message */}
          {!cards.length && (
            <>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => router.push('/')}
              >
                <Icon name="home" size={20} color="#fff" />
                <Text style={styles.saveText}>Home</Text>
              </TouchableOpacity>
              <Text style={styles.noRoutes}>No routes available</Text>
            </>
          )}
        </ScrollView>

        {/* Save button: store current route if not loaded from storage */}
        {!params.id && cards.length > 0 && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={async () => {
              try {
                const record = {
                  id: uuidv4(),           // unique identifier
                  origin,
                  destination,
                  originAirport,
                  stops,
                  stopsAirport,
                  modes,
                  start_date: startDate?.toISOString(),
                  end_date: endDate?.toISOString(),
                  price: priceLimit,
                  region,
                  people,
                };

                // Retrieve existing saved trips
                const json = await AsyncStorage.getItem('myTravels');
                const arr = json ? JSON.parse(json) : [];
                arr.push(record); // add new trip

                // Persist updated list
                await AsyncStorage.setItem('myTravels', JSON.stringify(arr));

                Alert.alert('Erfolg', 'Route gespeichert'); // success feedback
              } catch (error) {
                console.error('Error saving route:', error);
                Alert.alert('Error', 'Failed to save route.');
              }
            }}
          >
            <Icon name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

// Styles for layout and components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,             // inner spacing
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center', // center vertically
    alignItems: 'center',     // center horizontally
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  overallMap: {
    height: width * 0.8,      // aspect ratio
    borderRadius: 10,         // rounded corners
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',     // horizontal layout
    alignItems: 'center',     // vertical align
    gap: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,                  // take remaining space
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  noRoutes: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  saveButton: {
    position: 'absolute',     // overlay
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
  },
  homeButton: {
    position: 'absolute',
    top: 50,
    left: width * 0.35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ResultScreen;
