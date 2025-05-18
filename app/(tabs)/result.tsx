import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker, LatLng } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import { Flight, TransitRoute } from '@/interfaces/routes';
import { v4 as uuidv4 } from 'uuid';

// NEU: Import der Koordinaten
const airportCoordinates: Record<string, { latitude: number; longitude: number }> = require('../../data/airportCoordinates.json');

const { width, height } = Dimensions.get('window');

// Haversine-Funktion zur Berechnung der Entfernung (km)
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Erdradius in km
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const aa = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

// Decode polyline to coordinates (unterstützt nun auch JSON-Arrays)
function decodePolyline(encoded: string): LatLng[] {
  const trimmed = encoded.trim();
  // NEU: JSON-codierte gerade Linie
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as LatLng[];
    } catch {
      // Fallback auf Standard
    }
  }

  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

// Helpers
const toSeconds = (dur: string | number): number => {
  if (typeof dur === 'number') return dur;
  const m = dur.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Infinity;
};
function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  for (const key of Object.keys(raw ?? {})) {
    if (Array.isArray(raw[key])) return raw[key] as T[];
  }
  return [];
}

// Fetch routes ohne Logging
async function fetchLegMode(
  type: 'buses' | 'trains',
  from: string,
  to: string
): Promise<{ duration: number; distanceMeters: number; encodedPolyline: string }[]> {
  try {
    const raw = type === 'buses'
      ? await api.routes.getBusRoutes(from, to)
      : await api.routes.getTrains(from, to);
    const arr: TransitRoute[] = unwrapArray(raw);
    return arr.map(r => ({
      duration: toSeconds(r.duration),
      distanceMeters: r.distanceMeters,
      encodedPolyline: r.polyline.encodedPolyline,
    }));
  } catch {
    return [];
  }
}

// NEU: Manuelle Berechnung der Flight-Legs
async function fetchFlights(
  fromCode: string,
  toCode: string
): Promise<{ duration: number; distanceMeters: number; encodedPolyline: string }[]> {
  const coord1 = airportCoordinates[fromCode];
  const coord2 = airportCoordinates[toCode];
  if (!coord1 || !coord2) return [];
  const distKm = haversineDistance(coord1, coord2);
  const durationSec = distKm / 900 * 3600 + 3 * 3600;
  // Gerade Linie zwischen den beiden Flughäfen
  const encoded = JSON.stringify([coord1, coord2]);
  return [{
    duration: Math.round(durationSec),
    distanceMeters: Math.round(distKm * 1000),
    encodedPolyline: encoded,
  }];
}

async function getBestLeg(
  fromName: string,
  toName: string,
  fromAirport: string,
  toAirport: string,
  modes: string[]
): Promise<{
  route: { duration: number; distanceMeters: number; encodedPolyline: string };
  label: 'Bus' | 'Train' | 'Flight';
} | null> {
  type Candidate = { info: { duration: number; distanceMeters: number; encodedPolyline: string }; mode: 'Bus' | 'Train' | 'Flight' };
  const candidates: Candidate[] = [];

  if (modes.includes('bus')) {
    const infos = await fetchLegMode('buses', fromName, toName);
    candidates.push(...infos.map(info => ({ info, mode: 'Bus' })));
  }
  if (modes.includes('train')) {
    const infos = await fetchLegMode('trains', fromName, toName);
    candidates.push(...infos.map(info => ({ info, mode: 'Train' })));
  }
  if (modes.includes('flight') && fromAirport && toAirport) {
    const infos = await fetchFlights(fromAirport, toAirport);
    candidates.push(...infos.map(info => ({ info, mode: 'Flight' })));
  }

  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) =>
    a.info.duration < b.info.duration ? a : b
  );
  return { route: best.info, label: best.mode };
}

function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((v, i) =>
    permute(items.filter((_, j) => i !== j)).map(p => [v, ...p])
  );
}

// LegCard only uses minimal data
interface LegCardProps {
  modes: 'Flight' | 'Bus' | 'Train';
  duration: number;
  distanceMeters: number;
  originCity: string;
  destCity: string;
  date?: string;
}
const LegCard: React.FC<LegCardProps> = ({ modes, duration, distanceMeters, originCity, destCity, date }) => {
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const h0 = Math.floor(Math.random() * 24);
  const m0 = Math.floor(Math.random() * 60);
  const start = `${h0.toString().padStart(2,'0')}:${m0.toString().padStart(2,'0')}`;
  const endHour = (h0 + hours + ((m0 + mins) > 59 ? 1 : 0)) % 24;
  const endMin = (m0 + mins) % 60;
  const end = `${endHour.toString().padStart(2,'0')}:${endMin.toString().padStart(2,'0')}`;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Icon
          name={modes === 'Flight' ? 'airplane-outline' : modes === 'Bus' ? 'bus-outline' : 'train-outline'}
          size={24} color="#111"
        />
        <Text style={styles.productName}>{`${modes} ${originCity} - ${destCity}`}</Text>
      </View>
      <View style={styles.timelineRow}>
        <Text style={styles.timeText}>{start}</Text>
        <Text style={styles.durationText}>{`${hours}h ${mins}m`}</Text>
        <Text style={styles.timeText}>{end}</Text>
      </View>
      {date && <Text style={styles.dateText}>{date}</Text>}
    </View>
  );
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originAirport, setOriginAirport] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [stopsAirport, setStopsAirport] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [priceLimit, setPriceLimit] = useState<number>(Infinity);

  const [cards, setCards] = useState<LegCardProps[]>([]);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [markerCoords, setMarkerCoords] = useState<{ coordinate: LatLng; label: string }[]>([]);

  // **Mit Logging:**
  useEffect(() => {
    console.log('[ResultScreen] useEffect triggered with params:', params);

    (async () => {
      console.log('[ResultScreen] Starting route computation');
      setLoading(true);

      // Load from storage or params
      if (params.id) {
        console.log('[ResultScreen] Loading travel record from AsyncStorage for id', params.id);
        const json = await AsyncStorage.getItem('myTravels');
        const recs = json ? JSON.parse(json) : [];
        const rec = recs.find((r: any) => String(r.id) === String(params.id));
        console.log('[ResultScreen] Found record:', rec);
        if (rec) {
          setOrigin(rec.origin);
          setDestination(rec.destination);
          setOriginAirport(rec.originAirport || '');
          setStops(rec.stops || []);
          setStopsAirport(rec.stopsAirport || []);
          setModes(rec.modes || []);
          setStartDate(rec.start_date ? new Date(rec.start_date) : undefined);
          setEndDate(rec.end_date ? new Date(rec.end_date) : undefined);
          setPriceLimit(rec.price || Infinity);
        }
      } else {
        console.log('[ResultScreen] Using params directly');
        setOrigin(params.origin!);
        setDestination(params.origin!);
        setOriginAirport(params.originAirport || '');
        setStops(params.stops?.split(',') || []);
        setStopsAirport(params.stopsAirport?.split(',') || []);
        setModes(params.modes?.split(',') || []);
        setStartDate(params.start_date ? new Date(params.start_date) : undefined);
        setEndDate(params.end_date ? new Date(params.end_date) : undefined);
        setPriceLimit(params.price ? Number(params.price) : Infinity);
      }

      console.log('[ResultScreen] State values before permutation:', { origin, stops, destination, modes });
      const perms = permute(stops);

      let bestOverall: any = null;
      for (const perm of perms) {
        const seqCities = [origin, ...perm, destination];
        const seqAirports = [originAirport, ...perm.map((_, i) => stopsAirport[i] || ''), originAirport];
        let sumTime = 0;
        const legs: any[] = [];

        for (let i = 0; i < seqCities.length - 1; i++) {
          console.log(
            `[ResultScreen] Fetching best leg from ${seqCities[i]} to ${seqCities[i + 1]} with modes`,
            modes
          );
          const leg = await getBestLeg(
            seqCities[i],
            seqCities[i + 1],
            seqAirports[i],
            seqAirports[i + 1],
            modes
          );
          if (!leg) {
            sumTime = Infinity;
            break;
          }
          sumTime += leg.route.duration;
          legs.push(leg);
        }

        if (sumTime === Infinity) {
          console.log('[ResultScreen] Skipping permutation due to missing leg');
          continue;
        }

        if (!bestOverall || sumTime < bestOverall.time) {
          bestOverall = { legs, time: sumTime };
          console.log('[ResultScreen] New best route found:', bestOverall);
        }
      }

      if (bestOverall) {
        console.log('[ResultScreen] Best overall result:', bestOverall);
        const cardData = bestOverall.legs.map((leg: any, i: number) => ({
          modes: leg.label,
          duration: leg.route.duration,
          distanceMeters: leg.route.distanceMeters,
          originCity: i > 0 ? (stops[i - 1] || origin) : origin,
          destCity: i < stops.length ? stops[i] : destination,
          date: startDate?.toLocaleDateString(),
        }));
        setCards(cardData);

        // Build polyline and markers
        const coords: LatLng[] = [];
        const markers: any[] = [];
        const seqAirports = [originAirport, ...stopsAirport, params.destinationAirport || ''];

        bestOverall.legs.forEach((leg: any, idx: number) => {
          if (leg.label === 'Flight') {
            const [c1, c2] = JSON.parse(leg.route.encodedPolyline);
            coords.push(c1, c2);
            markers.push(
              { coordinate: c1, label: idx === 0 ? 'Origin' : `Stop ${idx}` },
              { coordinate: c2, label: idx === bestOverall.legs.length - 1 ? 'Destination' : `Stop ${idx + 1}` }
            );
          } else {
            const segment = decodePolyline(leg.route.encodedPolyline);
            coords.push(...segment);
            markers.push(
              { coordinate: segment[0], label: idx === 0 ? 'Origin' : `Stop ${idx}` },
              { coordinate: segment[segment.length - 1], label: idx === bestOverall.legs.length - 1 ? 'Destination' : `Stop ${idx + 1}` }
            );
          }
        });

        setPolylineCoords(coords);
        setMarkerCoords(markers);
      }

      setLoading(false);
      console.log('[ResultScreen] Finished route computation');
    })().catch(e => {
      console.error('[ResultScreen] Error during async route computation:', e);
      setLoading(false);
    });
  }, [
    params.id,
    params.start_date,
    params.end_date,
    params.stops,
    params.origin,
    params.price,
  ]);


  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text>loading route</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const getInitialRegion = (): undefined | {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } => {
    if (!polylineCoords.length) return undefined;

    const lats = polylineCoords.map(c => c.latitude);
    const lons = polylineCoords.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;
    const latDelta = Math.max(0.05, (maxLat - minLat) * 1.2);
    const lonDelta = Math.max(0.05, (maxLon - minLon) * 1.2);

    return {
      latitude: midLat,
      longitude: midLon,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {polylineCoords.length > 0 && (
          <MapView
            style={styles.overallMap}
            initialRegion={getInitialRegion()}
          >
            <Polyline coordinates={polylineCoords} strokeWidth={2} strokeColor={'blue'} />
            {markerCoords.map((m, i) => (
              <Marker key={i} coordinate={m.coordinate}/>
            ))}
          </MapView>
        )}

        {cards.map((c, idx) => (
          <LegCard
            key={idx}
            modes={c.modes}
            duration={c.duration}
            distanceMeters={c.distanceMeters}
            originCity={c.originCity}
            destCity={c.destCity}
            date={c.date}
          />
        ))}

        {!cards.length && (
          <Text style={styles.noRoutes}>Keine Routen verfügbar</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={async () => {
          const record = {
            id: uuidv4(),
            origin,
            originAirport,
            stops,
            stopsAirport,
            destination,
            modes,
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString(),
            price: priceLimit,
          };
          const json = await AsyncStorage.getItem('myTravels');
          const arr = json ? JSON.parse(json) : [];
          arr.push(record);
          await AsyncStorage.setItem('myTravels', JSON.stringify(arr));
          Alert.alert('Erfolg', 'Route gespeichert');
        }}
      >
        <Icon name="save-outline" size={20} color="#fff" />
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overallMap: {
    height: width * 0.8,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#000',
    borderWidth: 2,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productName: { fontSize: 14, fontWeight: '500', flex: 1 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: { fontSize: 12, color: '#6b7280' },
  durationText: { fontSize: 12, color: '#6b7280' },
  dateText: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 12,
    color: '#4b5563',
  },
  noRoutes: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '500', marginLeft: 8 },
});

