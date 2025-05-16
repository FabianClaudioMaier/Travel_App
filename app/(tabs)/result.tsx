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
import regionsData from '../../assets/data/regions.json';

// Typdefinition für Airport-Koordinaten
interface AirportCoordinatesMap {
  [iata: string]: { latitude: number; longitude: number };
}
const airportCoordinates: AirportCoordinatesMap = regionsData.airportCoordinates;

// --- Typen ---
interface Coordinate {
  latitude: number;
  longitude: number;
}
interface TransitRouteData {
  duration: string | number;
  distanceMeters: number;
  polyline: { encodedPolyline: string };
  routeData?: any;
}
interface FlightRouteData {
  duration: number;
  distanceMeters: number;
  pathPoints: Coordinate[];
}
interface Leg {
  route: TransitRouteData | FlightRouteData;
  label: string;
}
interface ResultScreenParams {
  origin: string;
  stops?: string[];
  destination: string;
  modes?: string[];
  originAirport?: string;
  stopsAirport?: string[];
  destinationAirport?: string;
  start_date?: string;
  end_date?: string;
}

// --- Polyline Decoder ---
function decodePolyline(encoded: string): Coordinate[] {
  const points: Coordinate[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    result = 0; shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

// --- Hilfsfunktionen ---
const toSeconds = (dur: string | number): number => {
  if (typeof dur === 'number') return dur;
  const m = dur.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Infinity;
};
const pickFastest = <T extends { duration: string | number }>(arr: T[]): T | null => {
  if (arr.length === 0) return null;
  return arr.reduce((best, cur) =>
    toSeconds(cur.duration) < toSeconds(best.duration) ? cur : best
  );
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ResultScreenParams>();

  console.log('🎯 ResultScreen Params:', params);

  // URL-Parameter auslesen
  const origin = params.origin!;
  const rawStops = params.stops;
  const stops = Array.isArray(rawStops) ? rawStops : rawStops ? [rawStops] : [];
  const destination = params.destination!;
  const rawModes = params.modes;
  const modes = Array.isArray(rawModes)
    ? rawModes
    : rawModes
      ? [rawModes]
      : ['transit'];
  const rawStart = params.start_date;
  const rawEnd   = params.end_date;
  const startDate = rawStart ? new Date(rawStart) : undefined;
  const endDate   = rawEnd   ? new Date(rawEnd)   : undefined;

  // Flughafen-Codes für Städte ermitteln
  const findAirport = (city: string): string => {
    const entry = regionsData.regions.find(r => r.city === city);
    return entry?.airport || 'VIE';
  };
  const originAirport      = params.originAirport      ?? findAirport(origin);
  const rawStopsAirport    = params.stopsAirport;
  const stopsAirport       = Array.isArray(rawStopsAirport)
    ? rawStopsAirport
    : rawStopsAirport
      ? [rawStopsAirport]
      : stops.map(findAirport);
  const destinationAirport = params.destinationAirport ?? findAirport(destination);

  // State
  const [finalLegs, setFinalLegs] = useState<(Leg|null)[]>([]);
  const [loading, setLoading]   = useState(true);

  // Koordinaten-Map initialisieren
  const coordsMap: AirportCoordinatesMap = { ...airportCoordinates };
  if (!coordsMap[originAirport])      coordsMap[originAirport]      = { latitude: 48.2082, longitude: 16.3738 };
  if (!coordsMap[destinationAirport]) coordsMap[destinationAirport] = coordsMap[originAirport];

  // API‐Aufrufe
  const fetchLegMode = async (type:'buses'|'trains', from:string, to:string): Promise<any[]> => {
    try {
      const url = `https://hci-backend-541730464130.europe-central2.run.app/routes/${type}` +
                  `?origin=${encodeURIComponent(from)}` +
                  `&destination=${encodeURIComponent(to)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      return Array.isArray(json.routes) ? json.routes : [];
    } catch {
      return [];
    }
  };
  const fetchFlights = async (fromCode:string, toCode:string): Promise<any[]> => {
    try {
      const url = `https://hci-backend-541730464130.europe-central2.run.app/routes/flights` +
                  `?origin=${encodeURIComponent(fromCode)}` +
                  `&destination=${encodeURIComponent(toCode)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      return Array.isArray(json) ? json : [];
    } catch {
      return [];
    }
  };

  // Route berechnen
  const fetchAndCompute = async () => {
    const names = [origin, ...stops, destination];
    const codes = [originAirport, ...stopsAirport, destinationAirport];
    console.log('🧭 Computing route for:', names, 'with airports', codes, 'modes', modes);

    const legsData = await Promise.all(
      names.slice(0,-1).map(async (fromName, i) => {
        const toName = names[i+1];
        const fromCode = codes[i]   || '';
        const toCode   = codes[i+1] || '';
        console.log(`➡️ Leg ${i}: ${fromName}→${toName}`, { fromCode, toCode });

        const candidates: Leg['route'][] = [];

        if (useTransit) {
          const [ busArr, trainArr ] = await Promise.all([
            fetchLegMode('buses', fromName, toName),
            fetchLegMode('trains', fromName, toName),
          ]);
          console.log(`   • got ${busArr.length} bus, ${trainArr.length} train options`);

          const bestBus   = pickFastest(busArr.map(r => ({
            duration: r.duration,
            distanceMeters: r.distanceMeters,
            polyline: { encodedPolyline: r.polyline.encodedPolyline },
            routeData: r,
          })));
          const bestTrain = pickFastest(trainArr.map(r => ({
            duration: r.duration,
            distanceMeters: r.distanceMeters,
            polyline: { encodedPolyline: r.polyline.encodedPolyline },
            routeData: r,
          })));
          if (bestBus)   candidates.push(bestBus);
          if (bestTrain) candidates.push(bestTrain);
        }

        if (useFlight && fromCode && toCode) {
          const flights = await fetchFlights(fromCode, toCode);
          console.log(`   • got ${flights.length} flight options`);

          if (flights.length > 0) {
            const bestF = flights.reduce((b,f) =>
              f.total_distance < b.total_distance ? f : b, flights[0]
            );
            const flightMins = bestF.path.reduce((sum:number,p:any)=>sum+p.duration,0)
              + bestF.stops_duration.reduce((sum:number,d:number)=>sum+d,0)
              + 180;
            const pA = coordsMap[fromCode];
            const pB = coordsMap[toCode];
            if (pA && pB) {
              candidates.push({
                duration: flightMins * 60,
                distanceMeters: bestF.total_distance * 1000,
                pathPoints: [pA, pB],
              });
            }
          }
        }

        if (candidates.length === 0) return null;
        const best = candidates.reduce((b,cur) =>
          toSeconds(cur.duration) < toSeconds(b.duration) ? cur : b
        );
        console.log(`   ⇒ best candidate for leg ${i}:`, best);

        return {
          route: best,
          label: candidates.length > 1 && 'duration' in best ? 'Transit' : 'Flug',
        };
      })
    );
    console.log('🏁 All legs computed:', legsData);
    setFinalLegs(legsData);
  };

  // Init: gespeicherte Route oder neu berechnen
     useEffect(() => {
        (async () => {
          console.log('🔍 Checking AsyncStorage for existing route…');
          let found = false;
          try {
            const json = await AsyncStorage.getItem('myTravels');
            console.log('💾 Loaded myTravels:', json);
            const trips = json ? JSON.parse(json) : [];
            const match = trips.find((t: any) =>
              t.origin === origin &&
              JSON.stringify(t.stops) === JSON.stringify(stops) &&
              t.destination === destination &&
              JSON.stringify(t.modes) === JSON.stringify(modes) &&
              t.start_date === rawStart &&
              t.end_date === rawEnd
            );
            if (match && Array.isArray(match.legs)) {
              console.log('✅ Found cached route:', match);
              setFinalLegs(match.legs);
              found = true;
            }
          } catch (e){
            console.warn('⚠️ Error reading AsyncStorage', e);
          }

          if (!found) {
            console.log('🚀 No cached route, computing new one…');
            await fetchAndCompute();
          }
          setLoading(false);
          console.log('🔔 Loading complete, finalLegs:', finalLegs);
        })();
      }, []);



  // Speichern
  const onSave = async () => {
    if (!finalLegs.some(l => l !== null)) {
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
    return <ActivityIndicator size="large" style={styles.loader}/>;
  }

  // Route-Karten rendern
  const renderRouteCard = (leg: Leg|null, idx: number) => {
    console.log(`🗺️ Rendering card ${idx}`, leg);
    if (!leg) return null;
    const { route, label } = leg;
    const coords: LatLng[] =
      'pathPoints' in route
        ? route.pathPoints
        : decodePolyline(route.polyline.encodedPolyline);
    const secs = toSeconds(route.duration);
    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const deltaLat = (Math.max(...lats) - Math.min(...lats)) * 1.2 || 0.05;
    const deltaLng = (Math.max(...lngs) - Math.min(...lngs)) * 1.2 || 0.05;

    return (
      <View key={idx} style={styles.card}>
        <Text style={styles.routeLabel}>
          {label} — {Math.floor(secs/3600)}h {Math.floor((secs%3600)/60)}m — {(route.distanceMeters/1000).toFixed(1)} km
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
        {'routeData' in route && route.routeData?.legs?.map((stepGroup:any,i:number) => (
          <View key={i} style={styles.step}>
            {stepGroup.steps?.map((st:any,j:number) => (
              <View key={j}>
                <Text>
                  {st.transitDetails.localizedValues.departureTime.time.text}
                  {' → '}
                  {st.transitDetails.localizedValues.arrivalTime.time.text}
                </Text>
                <Text>
                  From {st.transitDetails.stopDetails.departureStop.name}
                  {' to '}
                  {st.transitDetails.stopDetails.arrivalStop.name}
                </Text>
                <Text>
                  Line: {st.transitDetails.transitLine.nameShort || st.transitDetails.transitLine.name}
                </Text>
              </View>
            ))}
          </View>
        ))}
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
      {finalLegs.map((leg, idx) => renderRouteCard(leg, idx))}
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
  step:      { marginTop: 5, paddingVertical: 5, borderTopWidth: 1, borderColor: '#eee' },
  saveButton:{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF',
               width: 56, height: 56, borderRadius: 28, justifyContent: 'center',
               alignItems: 'center', elevation: 4 },
  noRoutes:  { textAlign: 'center', marginTop: 20 },
});
