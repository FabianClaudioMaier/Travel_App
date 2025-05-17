import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import MapView, { Polyline, Marker, LatLng } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import { Flight, TransitRoute } from '@/interfaces/routes';

interface RouteInfo {
  duration: number;
  distanceMeters: number;
  encodedPolyline: string;
  raw?: any;
}

interface Leg {
  route: RouteInfo;
  label: 'Bus' | 'Train' | 'Flight';
}

interface Params {
  origin: string;
  destination?: string;
  stops?: string;
  stopsAirport?: string;
  modes?: string;
  originAirport?: string;
  price?: string;
  start_date?: string;
  end_date?: string;
}

const { width } = Dimensions.get('window');

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

function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
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
  console.log(`→ Requesting ${type} from="${from}" to="${to}"`);
  try {
    const raw =
      type === 'buses'
        ? await api.routes.getBusRoutes(from, to)
        : await api.routes.getTrains(from, to);
    console.log(`← ${type} raw response:`, raw);
    const arr: TransitRoute[] = unwrapArray<TransitRoute>(raw);
    return arr.map(r => ({
      duration: toSeconds(r.duration),
      distanceMeters: r.distanceMeters,
      encodedPolyline: r.polyline.encodedPolyline,
      raw: r,
    }));
  } catch (e: any) {
    console.error(`✕ Error fetching ${type}`, e.response?.status, e.response?.data ?? e.message);
    return [];
  }
};

// fetch flights
const fetchFlights = async (
  fromCode: string,
  toCode: string
): Promise<RouteInfo[]> => {
  console.log(`→ Requesting flights from="${fromCode}" to="${toCode}"`);
  try {
    const raw = await api.routes.getFlights(fromCode, toCode);
    console.log('← flights raw response:', raw);
    const flights: Flight[] = unwrapArray<Flight>(raw);
    return flights.map(f => {
      const flightSecs =
        f.path.reduce((sum, seg) => sum + seg.duration, 0) +
        f.stops_duration.reduce((sum, d) => sum + d, 0) +
        3 * 3600;
      return {
        duration: flightSecs,
        distanceMeters: f.total_distance * 1000,
        encodedPolyline: f.encoded_polyline,
        raw: f,
      };
    });
  } catch (e: any) {
    console.error('✕ Error fetching flights', e.response?.status, e.response?.data ?? e.message);
    return [];
  }
};

async function getBestLeg(
  fromName: string,
  toName: string,
  fromAirport: string,
  toAirport: string,
  modes: string[]
): Promise<Leg | null> {
  console.log(`=== getBestLeg ${fromName}→${toName} airports ${fromAirport}→${toAirport} modes=`, modes);
  const candidates: RouteInfo[] = [];
  if (modes.includes('bus')) {
    candidates.push(...(await fetchLegMode('buses', fromName, toName)));
  }
  if (modes.includes('train')) {
    candidates.push(...(await fetchLegMode('trains', fromName, toName)));
  }
  if (modes.includes('flight') && fromAirport && toAirport) {
    candidates.push(...(await fetchFlights(fromAirport, toAirport)));
  }
  console.log(`→ candidates found:`, candidates.length);
  if (!candidates.length) return null;
  const best = candidates.reduce((a, b) => (a.duration < b.duration ? a : b));
  let label: 'Bus' | 'Train' | 'Flight' = 'Bus';
  if ((best.raw as any)?.encoded_polyline) label = 'Flight';
  else if ((best.raw as any)?.legs) label = 'Train';
  return { route: best, label };
}

function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const res: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const head = items[i];
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permute(rest)) res.push([head, ...p]);
  }
  return res;
}

// --- Card Component ---
interface LegCardProps {
  leg: {
    label: 'Flight' | 'Bus' | 'Train';
    route: { duration: number; distanceMeters: number; raw: any };
  };
  originCity: string;
  destCity: string;
  date?: string;
}

const LegCard: React.FC<LegCardProps> = ({ leg, originCity, destCity, date }) => {
  const { label, route } = leg;
  const hours = Math.floor(route.duration / 3600);
  const mins = Math.floor((route.duration % 3600) / 60);
  const hoursStart = Math.floor(Math.random() * 24);
  const minsStart = Math.floor(Math.random() * 60);
  const timeStart =
    (hoursStart < 10 ? '0' : '') + hoursStart + ':' + (minsStart < 10 ? '0' : '') + minsStart;
  const overflowHour = minsStart + mins > 59 ? 1 : 0;
  const timeEnd =
    ((hoursStart + hours + overflowHour) % 24 < 10 ? '0' : '') +
    ((hoursStart + hours + overflowHour) % 24) +
    ':' +
    (((minsStart + mins) % 60) < 10 ? '0' : '') +
    ((minsStart + mins) % 60);

  const airline = route.raw?.path?.[0]?.airline ?? '';
  const price = route.raw?.price ? `€ ${route.raw.price}` : '';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Icon
          name={
            label === 'Flight'
              ? 'airplane-outline'
              : label === 'Bus'
              ? 'bus-outline'
              : 'train-outline'
          }
          size={24}
          color="#111"
        />
        <Text style={styles.productName}>{`${label} ${originCity} - ${destCity}`}</Text>
      </View>
      <View style={styles.subRow}>
        <Text style={styles.subText}>{airline}</Text>
        <Text style={styles.subText}>{price}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.timelineRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeText}>
            {route.raw?.path?.[0]?.departureTime ?? timeStart}
          </Text>
        </View>
        <Icon name="arrow-forward-outline" size={16} />
        <Text style={styles.durationText}>{`${hours}h ${mins}m`}</Text>
        <Icon
          name="arrow-forward-outline"
          size={16}
          style={{ transform: [{ rotate: '180deg' }] }}
        />
        <View style={styles.timeBlock}>
          <Text style={styles.timeText}>
            {route.raw?.path?.slice(-1)[0]?.arrivalTime ?? timeEnd}
          </Text>
        </View>
      </View>
      {date && <Text style={styles.dateText}>{date}</Text>}
    </View>
  );
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  // Log all incoming params
  console.log('🏁 ResultScreen params:', params);

  // Parse params
  const origin = params.origin!;
  const destination = params.destination ?? origin;
  const originAirport = params.originAirport ?? '';
  const destinationAirport = params.originAirport ?? '';

  const rawStops = params.stops;
  const stops: string[] = rawStops ? rawStops.split(',') : [];

  const rawStopsAirport = params.stopsAirport;
  const stopsAirport: string[] = rawStopsAirport ? rawStopsAirport.split(',') : [];

  const priceLimit = params.price ? Number(params.price) : Infinity;
  const modes = params.modes?.split(',') ?? [];
  const rawStart = params.start_date;
  const rawEnd = params.end_date;
  const startDate = rawStart ? new Date(rawStart) : undefined;
  const endDate = rawEnd ? new Date(rawEnd) : undefined;

  const [finalLegs, setFinalLegs] = useState<(Leg & { date?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      console.log('▶️ Computing best route for:', {
        origin,
        stops,
        destination,
        modes,
        priceLimit,
        rawStart,
        rawEnd,
      });

      // Cache lookup
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
          console.log('← Found cached route', match);
          setFinalLegs(match.legs);
          found = true;
        }
      } catch (e) {
        console.warn('Cache load failed', e);
      }

      if (!found) {
        const perms = permute(stops);
        console.log(`→ Permutations (${perms.length}):`, perms);
        let bestOverall: { legs: (Leg | null)[]; time: number; price: number } | null = null;

        for (const perm of perms) {
          console.log('→ Trying sequence:', [origin, ...perm, destination]);
          const seqCities = [origin, ...perm, destination];
          const seqAirports = [
            originAirport,
            ...perm.map((_, i) => stopsAirport[i] || ''),
            destinationAirport,
          ];
          let sumTime = 0;
          let sumPrice = 0;
          const legs: (Leg | null)[] = [];

          for (let i = 0; i < seqCities.length - 1; i++) {
            const leg = await getBestLeg(
              seqCities[i],
              seqCities[i + 1],
              seqAirports[i],
              seqAirports[i + 1],
              modes
            );
            console.log('  ↳ leg result:', leg);
            if (!leg) {
              sumTime = Infinity;
              break;
            }
            sumTime += leg.route.duration;
            sumPrice += leg.route.distanceMeters * 0.0 + (leg.label === 'Flight' ? leg.route.raw.price : 0);
            legs.push(leg);
          }
          if (sumTime === Infinity) continue;
          if (sumPrice <= priceLimit) {
            if (!bestOverall || sumTime < bestOverall.time) {
              bestOverall = { legs, time: sumTime, price: sumPrice };
            }
          } else if (!bestOverall || (bestOverall.price > priceLimit && sumPrice < bestOverall.price)) {
            bestOverall = { legs, time: sumTime, price: sumPrice };
          }
        }

        if (bestOverall) {
          console.log('← Best overall:', bestOverall);
          setFinalLegs(bestOverall.legs as Leg[]);
        } else {
          console.log('← No valid route found');
        }
      }

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    // nothing—cards are built inline below
  }, [finalLegs]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

  // build markers & polyline
  const allCoords: LatLng[] = finalLegs
    .filter(Boolean)
    .flatMap(leg => decodePolyline(leg.route.encodedPolyline));

  const markers = allCoords.length
    ? [
        { coordinate: allCoords[0], label: 'Origin' },
        ...finalLegs.filter(Boolean).slice(0, -1).map((leg, i) => {
          const pts = decodePolyline(leg.route.encodedPolyline);
          return { coordinate: pts[pts.length - 1], label: `Stop ${i + 1}` };
        }),
        { coordinate: allCoords[allCoords.length - 1], label: 'Destination' },
      ]
    : [];

  return (
      <View styles={styles.container}>
        <ScrollView>
          <Text style={styles.header}>Routeübersicht</Text>
          {startDate && endDate && (
            <View style={styles.summaryContainer}>
              <Text>
                Reisedaten: {startDate.toLocaleDateString()} –{' '}
                {endDate.toLocaleDateString()}
              </Text>
            </View>
          )}
          {allCoords.length > 0 && (
            <MapView
              style={styles.overallMap}
              initialRegion={{
                latitude: (Math.min(...allCoords.map(c => c.latitude)) +
                           Math.max(...allCoords.map(c => c.latitude))) /
                          2,
                longitude: (Math.min(...allCoords.map(c => c.longitude)) +
                            Math.max(...allCoords.map(c => c.longitude))) /
                           2,
                latitudeDelta:
                  (Math.max(...allCoords.map(c => c.latitude)) -
                   Math.min(...allCoords.map(c => c.latitude))) *
                    1.2 ||
                  0.05,
                longitudeDelta:
                  (Math.max(...allCoords.map(c => c.longitude)) -
                   Math.min(...allCoords.map(c => c.longitude))) *
                    1.2 ||
                  0.05,
              }}
            >
              <Polyline coordinates={allCoords} strokeWidth={4} />
              {markers.map((m, i) => (
                <Marker key={i} coordinate={m.coordinate} />
              ))}
            </MapView>
          )}
          {finalLegs.map((leg, idx) => (
            <LegCard
              key={idx}
              leg={leg}
              originCity={
                idx === 0 ? origin : finalLegs[idx - 1]!.route.raw.city_name
              }
              destCity={idx === finalLegs.length - 1 ? destination : finalLegs[idx]!.route.raw.city_name}
              date={startDate?.toLocaleDateString()}
            />
          ))}
          {finalLegs.length === 0 && !loading && (
            <Text style={styles.noRoutes}>Keine Routen verfügbar</Text>
          )}

        </ScrollView>
        <TouchableOpacity style={styles.saveButton} onPress={async () => {
          const record = {
              id: Date.now(),
              origin,
              stops,
              destination,
              modes,
              start_date: rawStart,
              end_date: rawEnd,
              legs: finalLegs,
            };
            try {
              const json = await AsyncStorage.getItem('myTravels');
              const arr = json ? JSON.parse(json) : [];
              arr.push(record);
              await AsyncStorage.setItem('myTravels', JSON.stringify(arr));
              console.log('✓ Route saved');
            } catch (e) {
              console.error('✕ Save failed', e);
            }
          }}>
            <Icon name="save-outline" size={24} color="#fff" />
            <Text style={styles.saveText}> Save </Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  loader: { flex: 1, justifyContent: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  summaryContainer: { marginBottom: 10 },
  overallMap: {
    height: width * 0.8,
    borderRadius: 10,
    marginBottom: 10,
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 2,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#6c757d',
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productName: { fontSize: 14, fontWeight: '500', flex: 1 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  subText: { fontSize: 14, color: 'rgba(0,0,0,0.5)' },
  divider: { height: 1, backgroundColor: '#e6e6e6', marginVertical: 8 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBlock: { alignItems: 'center' },
  timeText: { fontSize: 12, color: '#6b7280' },
  durationText: { fontSize: 12, color: '#6b7280' },
  dateText: { position: 'absolute', top: 12, right: 12, fontSize: 12, color: '#4b5563' },
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
     elevation: 4,
  },
  saveText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '500',
     marginLeft: 8,
  },
});
