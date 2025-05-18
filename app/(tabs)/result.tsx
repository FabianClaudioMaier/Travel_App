// ResultScreen.tsx
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

interface RouteInfo {
  duration: number;
  distanceMeters: number;
  encodedPolyline: string;
}

interface Leg {
  route: RouteInfo;
  label: 'Bus' | 'Train' | 'Flight';
}

interface Params {
  id?: string;
  origin?: string;
  originAirport?: string;
  stops?: string;
  stopsAirport?: string;
  modes?: string;
  start_date?: string;
  end_date?: string;
  price?: string;
}

const { width, height } = Dimensions.get('window');

// Decode polyline to coordinates
function decodePolyline(encoded: string): LatLng[] {
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

// Fetch routes without logging
async function fetchLegMode(
  type: 'buses' | 'trains',
  from: string,
  to: string
): Promise<RouteInfo[]> {
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

async function fetchFlights(
  fromCode: string,
  toCode: string
): Promise<RouteInfo[]> {
  try {
    const raw = await api.routes.getFlights(fromCode, toCode);
    const flights: Flight[] = unwrapArray(raw);
    return flights.map(f => ({
      duration: f.path.reduce((s, seg) => s + seg.duration, 0)
        + f.stops_duration.reduce((s, d) => s + d, 0)
        + 3 * 3600,
      distanceMeters: f.total_distance * 1000,
      encodedPolyline: f.encoded_polyline,
    }));
  } catch {
    return [];
  }
}

async function getBestLeg(
  fromName: string,
  toName: string,
  fromAirport: string,
  toAirport: string,
  modes: string[]
): Promise<Leg | null> {
  type Candidate = { info: RouteInfo; mode: 'Bus' | 'Train' | 'Flight' };
  const candidates: Candidate[] = [];

  if (modes.includes('bus')) {
    const infos = await fetchLegMode('buses', fromName, toName);
    candidates.push(...infos.map(info => ({ info, mode: 'Bus' })));
  }
  if (modes.includes('train')) {
    const infos = await fetchLegMode('trains', fromName, toName);
    candidates.push(...infos.map(info => ({ info, mode: 'Train' })));
  }
  if (
    modes.includes('flight') &&
    fromAirport &&
    toAirport
  ) {
    const infos = await fetchFlights(fromAirport, toAirport);
    candidates.push(...infos.map(info => ({ info, mode: 'Flight' })));
  }

  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) =>
    a.info.duration < b.info.duration ? a : b
  );
  return {
    route: best.info,
    label: best.mode
  };
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

// Main ResultScreen
export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

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

  // Summary cards and polylines
  const [cards, setCards] = useState<LegCardProps[]>([]);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [markerCoords, setMarkerCoords] = useState<{coordinate:LatLng, label:string}[]>([]);

  useEffect(() => {
    (async () => {
      // **Neu:** Spinner aktivieren, bevor mit dem Laden begonnen wird
      setLoading(true);

      // Load from storage or params
      if (params.id) {
        const json = await AsyncStorage.getItem('myTravels');
        const recs = json ? JSON.parse(json) : [];
        const rec = recs.find((r:any) => r.id === params.id);
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
        const o = params.origin!;
        setOrigin(o);
        setDestination(o);
        setOriginAirport(params.originAirport || '');
        setStops(params.stops?.split(',') || []);
        setStopsAirport(params.stopsAirport?.split(',') || []);
        setModes(params.modes?.split(',') || []);
        setStartDate(params.start_date ? new Date(params.start_date) : undefined);
        setEndDate(params.end_date ? new Date(params.end_date) : undefined);
        setPriceLimit(params.price ? Number(params.price) : Infinity);
      }

      // Compute best route
      const perms = permute(stops);
      let bestOverall: { legs: (Leg|null)[]; time: number; price: number } | null = null;
      for (const perm of perms) {
        const seqCities = [origin, ...perm, destination];
        const seqAirports = [
          originAirport,
          ...perm.map((_,i) => stopsAirport[i] || ''),
          params.destinationAirport || ''
        ];
        let sumTime = 0, sumPrice = 0;
        const legs: (Leg|null)[] = [];
        for (let i=0; i<seqCities.length-1; i++) {
          const leg = await getBestLeg(
            seqCities[i], seqCities[i+1],
            seqAirports[i], seqAirports[i+1],
            modes
          );
          if (!leg) { sumTime = Infinity; break; }
          sumTime += leg.route.duration;
          sumPrice += (leg.label==='Flight' ? 0 : 0);
          legs.push(leg);
        }
        if (sumTime===Infinity) continue;
        if (!bestOverall ||
            (sumTime<bestOverall.time)
        ) {
          bestOverall = { legs, time: sumTime, price: sumPrice };
        }
      }

      if (bestOverall) {
        // Build cards
        const cardData = bestOverall.legs
          .filter((l): l is Leg => !!l)
          .map((leg, i) => ({
            modes: leg.label,
            duration: leg.route.duration,
            distanceMeters: leg.route.distanceMeters,
            originCity: i>0 ? (stops[i-1]||origin) : origin,
            destCity: i<stops.length ? stops[i] : destination,
            date: startDate?.toLocaleDateString(),
          }));
        setCards(cardData);

        // Build polyline coords and markers
        const coords = bestOverall.legs
          .filter((l): l is Leg => !!l)
          .flatMap(leg => decodePolyline(leg.route.encodedPolyline));
        setPolylineCoords(coords);
        const markers = coords.length
          ? [
              { coordinate: coords[0], label: 'Origin' },
              ...bestOverall.legs
                .filter((l): l is Leg => !!l)
                .slice(0, -1)
                .map((leg,i) => {
                  const pts = decodePolyline(leg.route.encodedPolyline);
                  return { coordinate: pts[pts.length-1], label: `Stop ${i+1}` };
                }),
              { coordinate: coords[coords.length-1], label: 'Destination' }
            ]
          : [];
        setMarkerCoords(markers);
      }

      // **Neu:** Spinner ausblenden, wenn alles fertig ist
      setLoading(false);
    })();
  }, [
    params.id,
    params.origin,
    params.stops,
    params.start_date,
    params.end_date,
    params.price,
  ]);

  // **immer** Spinner anzeigen, solange loading === true
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text> Wart kurz </Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {polylineCoords.length > 0 && (
          <MapView
            style={styles.overallMap}
            initialRegion={{
              latitude: polylineCoords[Math.floor(polylineCoords.length/2)].latitude,
              longitude: polylineCoords[Math.floor(polylineCoords.length/2)].longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            <Polyline coordinates={polylineCoords} strokeWidth={4} />
            {markerCoords.map((m, i) => (
              <Marker key={i} coordinate={m.coordinate} />
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
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  summaryContainer: { marginBottom: 10 },
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
