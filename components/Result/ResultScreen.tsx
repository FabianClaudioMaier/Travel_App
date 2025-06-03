// components/Result/ResultScreen.tsx

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
import { useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import CityCard from '@/components/community/CityCard';
import Header from '@/components/Result/Header';
import { City } from '@/interfaces/destinations';
import { TransitRoute } from '@/interfaces/routes';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const { width } = Dimensions.get('window');

interface ResultScreenProps {
  overrideParams?: Record<string, string>;
  onClose: () => void;
}

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
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

function decodePolyline(encoded: string): LatLng[] {
  if (encoded.trim().startsWith('[')) {
    try {
      return JSON.parse(encoded) as LatLng[];
    } catch {
      // fall back to manual decode
    }
  }
  const coords: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
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

const toSeconds = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : Infinity;
};

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    for (const v of Object.values(raw)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

interface LegInfo {
  duration: number;
  distanceMeters: number;
  encodedPolyline: string;
  price?: string;
}
type Mode = 'Bus' | 'Train' | 'Flight';

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
  } catch (err) {
    console.log('fetchLegMode error:', err);
    return [];
  }
}

async function fetchFlights(fromCode: string, toCode: string): Promise<LegInfo[]> {
  const airportCoordinates: Record<string, LatLng> = require('@/data/airportCoordinates.json');
  const origin = airportCoordinates[fromCode];
  const dest = airportCoordinates[toCode];
  if (!origin || !dest) return [];

  const distanceKm = haversineDistance(origin, dest);
  const durationSec = (distanceKm / 900) * 3600 + 3 * 3600;
  return [
    {
      duration: Math.round(durationSec),
      distanceMeters: Math.round(distanceKm * 1000),
      encodedPolyline: JSON.stringify([origin, dest]),
    },
  ];
}

async function getBestLeg(
  fromCity: string,
  toCity: string,
  fromAirport: string,
  toAirport: string,
  modes: string[],
  cities: City[],
): Promise<{ mode: Mode; info: LegInfo } | null> {
  const candidates: Array<{ mode: Mode; info: LegInfo }> = [];
  if (modes.includes('bus')) {
    const routes = await fetchLegMode('buses', fromCity, toCity);
    const city = cities.find(c => c.city_name === toCity);
    const price = city?.price?.bus
      ? `~€${city.price.bus.min}–${city.price.bus.max}`
      : 'N/A';
    routes.forEach(info => candidates.push({ mode: 'Bus', info: { ...info, price } }));
  }
  if (modes.includes('train')) {
    const routes = await fetchLegMode('trains', fromCity, toCity);
    const city = cities.find(c => c.city_name === toCity);
    const price = city?.price?.train
      ? `~€${city.price.train.min}–${city.price.train.max}`
      : 'N/A';
    routes.forEach(info => candidates.push({ mode: 'Train', info: { ...info, price } }));
  }
  if (modes.includes('flight') && fromAirport && toAirport) {
    const flights = await fetchFlights(fromAirport, toAirport);
    flights.forEach(info =>
      candidates.push({
        mode: 'Flight',
        info: { ...info, price: `€${Math.round(info.distanceMeters / 1000)}` },
      }),
    );
  }
  if (!candidates.length) return null;
  return candidates.reduce((best, curr) =>
    curr.info.duration < best.info.duration ? curr : best,
  );
}

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

const LegCard: FC<LegCardProps> = ({
  modes,
  duration,
  originCity,
  destCity,
  date,
  price,
}) => {
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const startHour = Math.floor(Math.random() * 24);
  const startMin = Math.floor(Math.random() * 60);
  const format = (n: number) => String(n).padStart(2, '0');
  const start = `${format(startHour)}:${format(startMin)}`;
  const endHour =
    (startHour + hours + (startMin + mins > 59 ? 1 : 0)) % 24;
  const endMin = (startMin + mins) % 60;
  const end = `${format(endHour)}:${format(endMin)}`;

  const handlePress = () => {
    const query = encodeURIComponent(`${modes} from ${originCity} to ${destCity}`);
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
        <Text style={styles.productName}>
          {`${modes} ${originCity} → ${destCity}`}
        </Text>
        {price && price !== 'N/A' && (
          <Text style={styles.price}>{price}</Text>
        )}
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

const ResultScreen: FC<ResultScreenProps> = ({
  overrideParams,
  onClose,
}) => {
  console.log('▶ ResultScreen mounted (overrideParams):', overrideParams);

  // Wenn overrideParams gesetzt ist, nimm diese, sonst URL-Params
  const routeParams = overrideParams ?? (useLocalSearchParams() as Record<string, string>);
  const params = routeParams;
  console.log('▶ Route-Parameter in ResultScreen:', params);

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

  const [cards, setCards] = useState<Array<{
    modes: string;
    duration: number;
    distanceMeters: number;
    originCity: string;
    destCity: string;
    date?: string;
    price?: string;
  }>>([]);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [markerCoords, setMarkerCoords] =
    useState<Array<{ coordinate: LatLng; label: string }>>([]);

  const [allCities, setAllCities] = useState<City[]>([]);
  const [cityDetails, setCityDetails] = useState<City[]>([]);

  // 1) Lade einmal die Städte
  useEffect(() => {
    console.log('▶ API-Request: Alle Städte abrufen');
    api.destinations
      .getAllCities()
      .then(cities => {
        console.log('▶ Alle Städte geladen, Länge =', cities.length);
        setAllCities(cities);
      })
      .catch(err => {
        console.error('❌ Fehler beim Laden der Städte:', err);
      });
  }, []);

  // 2) Sobald allCities da sind, berechne die Route
  useEffect(() => {
    console.log('▶ useEffect(allCities) triggered, allCities.length =', allCities.length);
    if (!allCities.length) return;

    (async () => {
      console.log('▶ Beginne Route-Berechnung (loading = true)');
      setLoading(true);
      setCards([]);
      setPolylineCoords([]);
      setMarkerCoords([]);

      let originVal: string;
      let destVal: string;
      let stopsArr: string[];
      let modesArr: string[];

      if (params.id) {
        console.log('▶ params.id gefunden:', params.id);
        const stored = await AsyncStorage.getItem('myTravels');
        const records = stored ? JSON.parse(stored) : [];
        const record = records.find((r: any) => String(r.id) === String(params.id));
        console.log('▶ Gefundener Record (AsyncStorage):', record);

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
          setRegion(record.region || '');
          setPeople(record.people || 0);
        } else {
          console.warn('⚠️ Kein Record in AsyncStorage passend gefunden – breche ab.');
          setLoading(false);
          return;
        }
      } else {
        console.log('▶ Kein params.id – benutze TripConfigurator-Params');
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
        setStartDate(
          params.start_date ? new Date(params.start_date as string) : undefined,
        );
        setEndDate(
          params.end_date ? new Date(params.end_date as string) : undefined,
        );
        setPriceLimit(params.price ? Number(params.price) : Infinity);
        setRegion((params.regionId as string) || '');
      }

      console.log('▶ originVal, destVal, stopsArr, modesArr:', {
        originVal,
        destVal,
        stopsArr,
        modesArr,
      });

      // --- Permutationen + getBestLeg-Loop (unverändert) ---
      // Diese Schleife sucht die schnellste Kombination.
      const permutations = permute(stopsArr);
      let bestOverall: { legs: Array<{ mode: Mode; info: LegInfo }>; time: number } | null =
        null;

      for (const perm of permutations) {
        const seqCities = [originVal, ...perm, destVal];
        const seqAirports = [
          originAirport,
          ...perm.map((_, i) => stopsAirport[i] || ''),
          (params.destinationAirport as string) || originAirport,
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

      if (bestOverall) {
        console.log('▶ Beste Route gefunden:', bestOverall);
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
            const [pt1, pt2] = JSON.parse(leg.info.encodedPolyline);
            coords.push(pt1, pt2);
            markers.push(
              {
                coordinate: pt1,
                label: idx === 0 ? 'Origin' : `Stop ${idx}`,
              },
              {
                coordinate: pt2,
                label:
                  idx === arr.length - 1 ? 'Destination' : `Stop ${idx + 1}`,
              },
            );
          } else {
            const segment = decodePolyline(leg.info.encodedPolyline);
            coords.push(...segment);
            markers.push(
              {
                coordinate: segment[0],
                label: idx === 0 ? 'Origin' : `Stop ${idx}`,
              },
              {
                coordinate: segment[segment.length - 1],
                label:
                  idx === arr.length - 1 ? 'Destination' : `Stop ${idx + 1}`,
              },
            );
          }
        });

        setCards(cardData);
        setPolylineCoords(coords);
        setMarkerCoords(markers);

        console.log('▶ Karten-Daten (cards):', cardData);
        console.log('▶ Polyline-Koordinaten:', coords.length, 'Punkte');
        console.log('▶ Marker-Koordinaten:', markers.length, 'Markers');
      } else {
        console.warn('⚠️ Keine gültige Route berechnet (bestOverall bleibt null)');
      }

      setLoading(false);
      console.log('▶ Datenladeprozess beendet (loading = false)');
    })();
  }, [params, allCities]);

  // 3) cityDetails updaten, wenn stops geändert wurden
  useEffect(() => {
    const details = allCities.filter(city => stops.includes(city.city_name));
    console.log('▶ cityDetails aktualisiert, Stops:', stops, 'Details:', details);
    setCityDetails(details);
  }, [allCities, stops]);

  // Solange loading=true, zeige nur Loader
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading route...</Text>
      </View>
    );
  }

  // Hilfsfunktion: Karte so zentrieren, dass alle Punkte reinpassen
  const computeInitialRegion = () => {
    if (!polylineCoords.length) return undefined;
    const lats = polylineCoords.map(c => c.latitude);
    const lons = polylineCoords.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.2),
      longitudeDelta: Math.max(0.05, (maxLon - minLon) * 1.2),
    };
  };

  return (
    <View style={styles.modalContent}>
      {/* Close-Button ganz oben rechts */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          console.log('▶ Close-Button gedrückt, onClose() aufrufen');
          onClose();
        }}
      >
        <Icon name="close" size={30} color="#000" />
      </TouchableOpacity>

      {/* Header (Region / Datum / Gäste) */}
      <Header
        region={region || 'Start a new Search'}
        dateRange={
          startDate && endDate
            ? `${startDate.toLocaleDateString('de-DE')} – ${endDate.toLocaleDateString(
                'de-DE',
              )}`
            : 'Select a Region'
        }
        guests={people ? `${people} Travelers` : 'in the Homescreen'}
      />

      <View style={styles.container}>
        <ScrollView>
          {/* Wenn polylineCoords da sind, zeige Map */}
          {polylineCoords.length > 0 && (
            <MapView
              style={styles.overallMap}
              initialRegion={computeInitialRegion()}
            >
              <Polyline
                coordinates={polylineCoords}
                strokeWidth={2}
                strokeColor="blue"
              />
              {markerCoords.map((marker, idx) => (
                <Marker
                  key={idx}
                  coordinate={marker.coordinate}
                  title={marker.label}
                />
              ))}
            </MapView>
          )}

          {/* Zeige für jeden Leg eine LegCard + eventuell CityCard darunter */}
          {cards.map((card, idx) => (
            <React.Fragment key={idx}>
              <LegCard {...card} />
              {idx < cityDetails.length && <CityCard city={cityDetails[idx]} />}
            </React.Fragment>
          ))}

          {/* Falls keine Route */}
          {!cards.length && (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, borderRadius: 10, paddingHorizontal: 10, height: 150 }}>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => {
                  console.log('▶ Keine LegCards – Home gedrückt → onClose()');
                  onClose();
                }}
              >
                <Icon name="home" size={20} color="#fff" />
                <Text style={styles.saveText}>Try another route</Text>
              </TouchableOpacity>
              <Text style={styles.noRoutes}> Sadly there are no routes available</Text>
            </View>
          )}
        </ScrollView>

        {/* Save-Button, falls neu berechnet (params.id fehlt) */}
        {!params.id && cards.length > 0 && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={async () => {
              try {
                console.log('▶ Save-Button gedrückt, speichere aktuellen Trip');
                const record = {
                  id: uuidv4(),
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
                const json = await AsyncStorage.getItem('myTravels');
                const arr = json ? JSON.parse(json) : [];
                arr.push(record);
                await AsyncStorage.setItem('myTravels', JSON.stringify(arr));
                console.log('▶ Route gespeichert:', record);
                Alert.alert('Route saved', 'View it in "myTravels"');
              } catch (error) {
                console.error('❌ Fehler beim Speichern:', error);
                Alert.alert('Error', 'Failed to save route.');
              }
            }}
          >
            <Icon name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Neuer Style für den Container, der im Modal sitzt:
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  overallMap: {
    height: width * 0.8,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    padding: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    fontSize: 20,
    fontWeight: '500',
    color: '#fff'
  },
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
  homeButton: {
    position: 'absolute',
    top: width * 0.2, // direkt unter der Karte + Header
    left: (width - 200) / 2,
    zIndex: 5,
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
