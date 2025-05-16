import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Polyline, LatLng } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import { PlaneRoutes, TransitRoute } from '@/interfaces/routes';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  duration: number;                 // in seconds
  distanceMeters: number;
  encodedPolyline: string;
  raw?: any;                        // optional full API response
}

interface Leg {
  route: RouteInfo;
  label: 'Bus' | 'Train' | 'Flight';
}

interface Params {
  origin: string;
  stops?: string[];
  modes?: string;       // e.g. "flight,train,bus"
  originAirport?: string;
  stopsAirport?: string;
  price?: string;
  start_date?: string;
  end_date?: string;
}

// Polyline decoder
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    result = 0; shift = 0;
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

// am besten oben im File ein kleines Hilfs-Unwrapping
function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  // nach erstbestem Array in den Feldern schauen
  for (const key of Object.keys(raw ?? {})) {
    if (Array.isArray(raw[key])) {
      return raw[key] as T[];
    }
  }
  console.warn('unwrapArray konnte kein Array finden, raw=', raw);
  return [];
}

// fetch buses or trains
const fetchLegMode = async (
  type: 'buses' | 'trains',
  from: string,
  to: string
): Promise<RouteInfo[]> => {
  console.log(`📍 fetchLegMode ${type}: from=${from} to=${to}`);
  try {
    // rohes Ergebnis holen
    const raw = type === 'buses'
      ? await api.routes.getBusRoutes(from, to)
      : await api.routes.getTrains(from, to);

    // hier wird garantiert ein Array draus
    const arr: TransitRoute[] = unwrapArray<TransitRoute>(raw);

    return arr.map(r => ({
      duration: toSeconds(r.duration),
      distanceMeters: r.distanceMeters,
      encodedPolyline: r.polyline.encodedPolyline,
      raw: r,
    }));
  } catch (e) {
    console.error(`Error fetching ${type}:`, e);
    return [];
  }
};

// fetch flights
const fetchFlights = async (
  fromCode: string,
  toCode: string
): Promise<RouteInfo[]> => {
  console.log(`📍 fetchFlights: from=${fromCode} to=${toCode}`);
  try {
    const raw = await api.routes.getFlights(fromCode, toCode);
    const flights: Flight[] = unwrapArray<Flight>(raw);

    return flights.map(f => {
      const flightSecs =
        f.path.reduce((sum, seg) => sum + seg.duration, 0)
        + f.stops_duration.reduce((sum, d) => sum + d, 0)
        + 3 * 3600; // 3h buffer

      return {
        duration: flightSecs,
        distanceMeters: f.total_distance * 1000,
        encodedPolyline: f.encoded_polyline,
        raw: f,
      };
    });
  } catch (e) {
    console.log('Error fetching flights:', e);
    return [];
  }
};

// Best leg under allowed modes
async function getBestLeg(
  fromName: string, toName: string,
  fromAirport: string, toAirport: string,
  modes: string[]
): Promise<Leg | null> {
  const candidates: RouteInfo[] = [];

  if (modes.includes('bus')) {
    candidates.push(...await fetchLegMode('buses', fromName, toName));
  }
  if (modes.includes('train')) {
    candidates.push(...await fetchLegMode('trains', fromName, toName));
  }
  if (modes.includes('flight') && fromAirport && toAirport) {
    candidates.push(...await fetchFlights(fromAirport, toAirport));
  }

  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) => a.duration < b.duration ? a : b);
  let label: 'Bus'|'Train'|'Flight' = 'Bus';
  if (best.raw?.encoded_polyline) label = 'Flight';
  else if (best.raw?.legs) label = 'Train';
  return { route: best, label };
}

// Generate permutations
function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const res: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const head = items[i];
    const rest = [...items.slice(0, i), ...items.slice(i+1)];
    for (const p of permute(rest)) res.push([head, ...p]);
  }
  return res;
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const origin         = params.origin!;
  const stops          = params.stops ? (Array.isArray(params.stops) ? params.stops : [params.stops]) : [];
  const destination    = params.origin!;
  const priceLimit     = params.price ? Number(params.price) : Infinity;
  const modes          = params.modes ? params.modes.split(',') : ['transit'];
  const originAirport  = params.originAirport || '';
  const stopsAirport   = params.stopsAirport
    ? (Array.isArray(params.stopsAirport) ? params.stopsAirport : [params.stopsAirport])
    : [];
  const destinationAirport = params.originAirport || '';
  const rawStart       = params.start_date;
  const rawEnd         = params.end_date;
  const startDate      = rawStart ? new Date(rawStart) : undefined;
  const endDate        = rawEnd   ? new Date(rawEnd)   : undefined;

  const [finalLegs, setFinalLegs] = useState<(Leg|null)[]>([]);
  const [loading, setLoading]     = useState(true);

  // Try cache, otherwise compute best permutation
  useEffect(() => {
    (async () => {
      // 1) Cache?
      let found = false;
      try {
        const json = await AsyncStorage.getItem('myTravels');
        const trips = json ? JSON.parse(json) : [];
        const match = trips.find((t: any) =>
          t.origin === origin &&
          JSON.stringify(t.stops) === JSON.stringify(stops) &&
          t.destination === destination &&
          JSON.stringify(t.modes) === JSON.stringify(modes) &&
          t.start_date === rawStart &&
          t.end_date === rawEnd
        );
        if (match) {
          setFinalLegs(match.legs);
          found = true;
        }
      } catch { /* ignore */ }

      if (!found) {
        // 2) Compute all permutations
        const perms = permute(stops);
        let bestOverall: { legs: (Leg|null)[]; time: number; price: number } | null = null;

        for (const perm of perms) {
          const seqCities   = [origin, ...perm, destination];
          const seqAirports = [
            originAirport,
            ...perm.map((c,i) => stopsAirport[i] || ''),
            destinationAirport
          ];

          let sumTime = 0, sumPrice = 0;
          const legs: (Leg|null)[] = [];

          for (let i = 0; i < seqCities.length - 1; i++) {
            const leg = await getBestLeg(
              seqCities[i], seqCities[i+1],
              seqAirports[i], seqAirports[i+1],
              modes
            );
            if (!leg) { sumTime = Infinity; break; }
            sumTime  += leg.route.duration;
            sumPrice += leg.route.distanceMeters * 0.0 // placeholder price logic
                       + (leg.label === 'Flight' ? leg.route.raw.price : 0);
            legs.push(leg);
          }
          if (sumTime === Infinity) continue;

          // within budget?
          if (sumPrice <= priceLimit) {
            if (!bestOverall || sumTime < bestOverall.time) {
              bestOverall = { legs, time: sumTime, price: sumPrice };
            }
          } else if (
            !bestOverall ||
            (bestOverall.price > priceLimit && sumPrice < bestOverall.price)
          ) {
            bestOverall = { legs, time: sumTime, price: sumPrice };
          }
        }

        setFinalLegs(bestOverall ? bestOverall.legs : []);
      }

      setLoading(false);
    })();
  }, []);

  // Save to cache
  const onSave = async () => {
    if (!finalLegs.length) {
      Alert.alert('Fehler', 'Keine Route zum Speichern vorhanden.');
      return;
    }
    const record = {
      id: Date.now(),
      origin, stops, destination, modes,
      start_date: rawStart, end_date: rawEnd,
      legs: finalLegs
    };
    try {
      const json = await AsyncStorage.getItem('myTravels');
      const arr = json ? JSON.parse(json) : [];
      arr.push(record);
      await AsyncStorage.setItem('myTravels', JSON.stringify(arr));
      Alert.alert('Gespeichert', 'Deine Route wurde abgelegt.');
    } catch {
      Alert.alert('Fehler', 'Speichern fehlgeschlagen.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  const renderRouteCard = (leg: Leg|null, idx: number) => {
    if (!leg) return null;
    const { route, label } = leg;
    const coords = decodePolyline(route.encodedPolyline);
    const hrs   = Math.floor(route.duration / 3600);
    const mins  = Math.floor((route.duration % 3600) / 60);

    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const deltaLat = (Math.max(...lats) - Math.min(...lats)) * 1.2 || 0.05;
    const deltaLng = (Math.max(...lngs) - Math.min(...lngs)) * 1.2 || 0.05;

    return (
      <View key={idx} style={styles.card}>
        <Text style={styles.routeLabel}>
          {label} — {hrs}h {mins}m — {(route.distanceMeters/1000).toFixed(1)} km
        </Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: deltaLat,
            longitudeDelta: deltaLng,
          }}
        >
          <Polyline coordinates={coords} strokeWidth={4} />
        </MapView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Routeübersicht</Text>
      {startDate && endDate && (
        <View style={styles.summaryContainer}>
          <Text>
            Reisedaten: {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
          </Text>
        </View>
      )}
      {finalLegs.map((leg, i) => renderRouteCard(leg, i))}
      {finalLegs.every(l => l === null) && (
        <Text style={styles.noRoutes}>Keine Routen verfügbar</Text>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Icon name="save-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  loader:    { flex: 1, justifyContent: 'center' },
  header:    { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  summaryContainer: { marginBottom: 10 },
  card:      { backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 2 },
  routeLabel:{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  map:       { height: 150, borderRadius: 8, marginVertical: 5 },
  saveButton:{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF',
               width: 56, height: 56, borderRadius: 28, justifyContent: 'center',
               alignItems: 'center', elevation: 4 },
  noRoutes:  { textAlign: 'center', marginTop: 20 },
});
