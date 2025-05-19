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

const airportCoordinates: Record<string, { latitude: number; longitude: number }> = require('../../data/airportCoordinates.json');
const { width, height } = Dimensions.get('window');

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const aa = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function decodePolyline(encoded: string): LatLng[] {
  if (encoded.trim().startsWith('[')) {
    try { return JSON.parse(encoded) as LatLng[]; }
    catch {}
  }
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
    points.push({ latitude: lat/1e5, longitude: lng/1e5 });
  }
  return points;
}

const toSeconds = (dur: string|number): number =>
  typeof dur === 'number'
    ? dur
    : (dur.match(/(\d+)/)?.[1] ? parseInt(RegExp.$1, 10) : Infinity);

function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  for (const k of Object.keys(raw ?? {})) {
    if (Array.isArray(raw[k])) return raw[k] as T[];
  }
  return [];
}

async function fetchLegMode(
  type: 'buses'|'trains',
  from: string,
  to: string
): Promise<{ duration:number; distanceMeters:number; encodedPolyline:string }[]> {
  try {
    const raw = type === 'buses'
      ? await api.routes.getBusRoutes(from, to)
      : await api.routes.getTrains(from, to);
    return unwrapArray(raw).map((r: TransitRoute) => ({
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
): Promise<{ duration:number; distanceMeters:number; encodedPolyline:string }[]> {
  const c1 = airportCoordinates[fromCode];
  const c2 = airportCoordinates[toCode];
  if (!c1 || !c2) return [];
  const distKm = haversineDistance(c1, c2);
  const durationSec = distKm/900*3600 + 3*3600;
  return [{
    duration: Math.round(durationSec),
    distanceMeters: Math.round(distKm*1000),
    encodedPolyline: JSON.stringify([c1,c2]),
  }];
}

async function getBestLeg(
  fromName:string,
  toName:string,
  fromAirport:string,
  toAirport:string,
  modes:string[],
  cities: City[]
) {
  type C = {
    info: {
      duration: number;
      distanceMeters: number;
      encodedPolyline: string;
      price?: string;
    };
    mode: 'Bus' | 'Train' | 'Flight';
  };

  const cand: C[] = [];

  if (modes.includes('bus')) {
    const infos = await fetchLegMode('buses', fromName, toName);
    const city = cities.find(c => c.city_name === toName);
    const busPrice = city?.price?.bus ? `~€${city.price.bus.min}–${city.price.bus.max}` : 'N/A';

    infos.forEach(info =>
      cand.push({
        info: { ...info, price: busPrice },
        mode: 'Bus'
      })
    );
  }

  if (modes.includes('train')) {
    const infos = await fetchLegMode('trains', fromName, toName);
    const city = cities.find(c => c.city_name === toName);
    const trainPrice = city?.price?.train ? `~€${city.price.train.min}–${city.price.train.max}` : 'N/A';

    infos.forEach(info =>
      cand.push({
        info: { ...info, price: trainPrice },
        mode: 'Train'
      })
    );
  }

  if (modes.includes('flight') && fromAirport && toAirport) {
    const infos = await fetchFlights(fromAirport, toAirport);
    infos.forEach(info =>
      cand.push({
        info: { ...info, price: `€${Math.round(info.distanceMeters / 1000)}` }, // Dummy or distance-based estimation
        mode: 'Flight'
      })
    );
  }

  if (!cand.length) return null;

  return cand.reduce((a, b) => a.info.duration < b.info.duration ? a : b);
}


function permute<T>(items:T[]):T[][] {
  if (items.length<=1) return [items];
  return items.flatMap((v,i)=>
    permute(items.filter((_,j)=>i!==j)).map(p=>[v,...p])
  );
}

interface LegCardProps {
  modes:'Flight'|'Bus'|'Train';
  duration:number;
  distanceMeters:number;
  originCity:string;
  destCity:string;
  date?:string;
  price?:string;
}
const LegCard: React.FC<LegCardProps> = ({ modes, duration, originCity, destCity, date, price }) => {
  const hours = Math.floor(duration/3600);
  const mins  = Math.floor((duration%3600)/60);
  const h0 = Math.floor(Math.random()*24);
  const m0 = Math.floor(Math.random()*60);
  const start = `${String(h0).padStart(2,'0')}:${String(m0).padStart(2,'0')}`;
  const endH = (h0 + hours + ((m0+mins)>59?1:0))%24;
  const endM = (m0 + mins)%60;
  const end = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;

  return (
    <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => {
          const query = encodeURIComponent(`${modes} to ${destCity}`);
          const url = `https://www.google.com/search?q=${query}`;
          Linking.openURL(url).catch(err =>
            console.error('Failed to open URL:', err)
          );
        }}
    >
      <View style={styles.headerRow}>
        <Icon
          name={modes==='Flight'?'airplane-outline':modes==='Bus'?'bus-outline':'train-outline'}
          size={24} color="#111"
        />
        <Text style={styles.productName}>{`${modes} ${originCity} → ${destCity}`}</Text>
        {(price != 'N/A') && <Text style={styles.productName}>{price}</Text>}
        <Icon name='open-outline' size={24}/>
      </View>
      <View style={styles.timelineRow}>
        <Text style={styles.timeText}>{start}</Text>
        <Text style={styles.durationText}>{`${hours}h ${mins}m`}</Text>
        <Text style={styles.timeText}>{end}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading]         = useState(true);
  const [origin, setOrigin]           = useState('');
  const [destination, setDestination] = useState('');
  const [originAirport, setOriginAirport] = useState('');
  const [stops, setStops]                 = useState<string[]>([]);
  const [stopsAirport, setStopsAirport]   = useState<string[]>([]);
  const [modes, setModes]                 = useState<string[]>([]);
  const [startDate, setStartDate]         = useState<Date>();
  const [endDate,   setEndDate]           = useState<Date>();
  const [priceLimit, setPriceLimit]       = useState<number>(Infinity);
  const [region, setRegion]            = useState('');
  const [people, setPeople]            = useState('');

  const [cards, setCards]               = useState<LegCardProps[]>([]);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [markerCoords, setMarkerCoords]     = useState<{coordinate:LatLng;label:string}[]>([]);

  const [allCities, setAllCities]     = useState<City[]>([]);
  const [cityDetails, setCityDetails] = useState<City[]>([]);

  // 1) Routen-Berechnung
  useEffect(() => {
    if (!allCities.length) return;
    (async () => {
      setLoading(true);

      setCards([]);
      setPolylineCoords([]);
      setMarkerCoords([]);

      // --- 1. Parameter oder Record entpacken in lokale Variablen ---
      let originVal:string, destVal:string, stopsArr:string[], modesArr:string[];
      if (params.id) {
        const raw = await AsyncStorage.getItem('myTravels');
        const recs = raw ? JSON.parse(raw) : [];
        const rec  = recs.find((r:any)=>String(r.id)===String(params.id));
        originVal = rec?.origin   || '';
        destVal   = rec?.destination||'';
        stopsArr  = rec?.stops    || [];
        modesArr  = rec?.modes    || [];
        setOrigin(rec.origin);
        setDestination(rec.destination);
        setOriginAirport(rec.originAirport||'');
        setStops(rec.stops||[]);
        setStopsAirport(rec.stopsAirport||[]);
        setModes(rec.modes||[]);
        setStartDate(rec.start_date?new Date(rec.start_date):undefined);
        setEndDate(rec.end_date?new Date(rec.end_date):undefined);
        setPriceLimit(rec.price||Infinity);
        setRegion(rec.regionId||'');
        setPeople(rec.people||'');
      } else {
        originVal = params.origin   || '';
        destVal   = params.destination||'';
        stopsArr  = params.stops?.split(',')||[];
        modesArr  = params.modes?.split(',')||[];
        peopleNum  = params.people?.split(',')||[];
        setOrigin(params.origin!);
        setDestination(params.destination!);
        setOriginAirport(params.originAirport||'');
        setStops(params.stops?.split(',')||[]);
        setStopsAirport(params.stopsAirport?.split(',')||[]);
        setModes(params.modes?.split(',')||[]);
        setStartDate(params.start_date?new Date(params.start_date):undefined);
        setEndDate(params.end_date?new Date(params.end_date):undefined);
        setPriceLimit(params.price?Number(params.price):Infinity);
        setRegion(params.regionId?params.regionId:'');
        setPeople(params.numberOfAdults?Number(params.numberOfAdults) + (params.numberOfChildren?Number(params.numberOfChildren) : 0) : 0);
      }

      // --- 2. Log & Permutation mit lokalen Werten ---
      console.log('Compute route for', {originVal, destVal, stopsArr, modesArr});
      const permutations = permute(stopsArr);
      let bestOverall:any = null;

      for (const perm of permutations) {
        const seqCities = [originVal, ...perm, destVal];
        const seqAirports = [
          originAirport,
          ...perm.map((_,i)=>stopsAirport[i]||''),
          params.destinationAirport||''
        ];
        let sumTime = 0;
        const legs:any[] = [];

        for (let i=0; i<seqCities.length-1; i++) {
          const leg = await getBestLeg(
            seqCities[i], seqCities[i+1],
            seqAirports[i], seqAirports[i+1],
            modesArr,
            allCities
          );
          if (!leg) { sumTime = Infinity; break; }
          sumTime += leg.info.duration;
          legs.push(leg);
        }
        if (sumTime===Infinity) continue;
        if (!bestOverall || sumTime<bestOverall.time) {
          bestOverall = { legs, time: sumTime };
        }
      }

      // --- 3. Card- und Map-Daten setzen ---
      if (bestOverall) {
        const cardData = bestOverall.legs.map((l:any,i:number)=>({
          modes: l.mode,
          duration: l.info.duration,
          distanceMeters: l.info.distanceMeters,
          originCity: i>0?stopsArr[i-1]:originVal,
          destCity: i<stopsArr.length?stopsArr[i]:destVal,
          date: startDate?.toLocaleDateString(),
          price: l.info.price,
        }));

        const coords:LatLng[] = [];
        const markers:any[] = [];
        bestOverall.legs.forEach((l:any,idx:number)=>{
          if (l.mode==='Flight') {
            const [c1,c2] = JSON.parse(l.info.encodedPolyline);
            coords.push(c1,c2);
            markers.push(
              {coordinate:c1, label: idx===0?'Origin':`Stop ${idx}`},
              {coordinate:c2, label: idx===bestOverall.legs.length-1?'Destination':`Stop ${idx+1}`}
            );
          } else {
            const seg = decodePolyline(l.info.encodedPolyline);
            coords.push(...seg);
            markers.push(
              {coordinate:seg[0],                 label: idx===0?'Origin':`Stop ${idx}`},
              {coordinate:seg[seg.length-1],      label: idx===bestOverall.legs.length-1?'Destination':`Stop ${idx+1}`}
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

  // 2) Cities für CityCards
  useEffect(() => {
    api.destinations.getAllCities().then(setAllCities).catch(console.error);
  }, []);
  useEffect(() => {
    const details = allCities
      .filter(c => stops.includes(c.city_name));
    setCityDetails(details);
  }, [allCities, stops]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text>loading route</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRegion = () => {
    if (!polylineCoords.length) return undefined;
    const lats = polylineCoords.map(c=>c.latitude);
    const lons = polylineCoords.map(c=>c.longitude);
    const minLat=Math.min(...lats), maxLat=Math.max(...lats);
    const minLon=Math.min(...lons), maxLon=Math.max(...lons);
    return {
      latitude: (minLat+maxLat)/2,
      longitude:(minLon+maxLon)/2,
      latitudeDelta: Math.max(0.05,(maxLat-minLat)*1.2),
      longitudeDelta:Math.max(0.05,(maxLon-minLon)*1.2),
    };
  };

  return (
    <>
    <Header
      region={region || "Start a new Search"}
      dateRange={
        startDate && endDate
          ? `${startDate.toLocaleDateString('de-DE')} – ${endDate.toLocaleDateString('de-DE')}`
          : "Select a Region"
      }
      guests={people? people + ' Travelers' : "in the Homescreen"}
    />
    <View style={styles.container}>
      <ScrollView>
        {polylineCoords.length>0 && (
          <MapView style={styles.overallMap} initialRegion={initialRegion()}>
            <Polyline coordinates={polylineCoords} strokeWidth={2} strokeColor="blue"/>
            {markerCoords.map((m,i)=><Marker key={i} coordinate={m.coordinate}/>)}
          </MapView>
        )}

        {cards.map((c,idx) => (
          <React.Fragment key={idx}>
            <LegCard {...c}/>
            {idx<cityDetails.length && <CityCard city={cityDetails[idx]}/>}
          </React.Fragment>
        ))}

        {!cards.length && (
          <>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push('/')}
            >
              <Icon name="home" size={20} color="#fff"/>
              <Text style={styles.saveText}>Home</Text>
            </TouchableOpacity>
            <Text style={styles.noRoutes}>No routes available</Text>
          </>
        )}
      </ScrollView>

      {!params.id && cards.length > 0 && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={async () => {
            try {
              const rec = {
                id: uuidv4(),
                origin, destination, originAirport,
                stops, stopsAirport, modes,
                start_date: startDate?.toISOString(),
                end_date: endDate?.toISOString(),
                price: priceLimit,
                region,
                people
              };

              const json = await AsyncStorage.getItem('myTravels');
              const arr = json ? JSON.parse(json) : [];
              arr.push(rec);
              await AsyncStorage.setItem('myTravels', JSON.stringify(arr));

              console.log("Gespeicherte Reisen:", arr);
              Alert.alert('Erfolg', 'Route gespeichert');
            } catch (err) {
              console.error("Fehler beim Speichern:", err);
              Alert.alert('Fehler', 'Speichern fehlgeschlagen.');
            }
          }}
        >
          <Icon name="save-outline" size={20} color="#fff"/>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  </>
  );
}

const styles = StyleSheet.create({
  container: {flex:1,padding:10},
  loaderContainer:{flex:1,justifyContent:'center',alignItems:'center'},
  overallMap:{height:width*0.8,borderRadius:10,marginBottom:10,borderWidth:2,borderColor:'#000'},
  cardContainer:{backgroundColor:'#fff',borderRadius:8,borderWidth:1,borderColor:'#6c757d',padding:12,marginBottom:12},
  headerRow:{flexDirection:'row',alignItems:'center',gap:8},
  productName:{fontSize:14,fontWeight:'500',flex:1},
  timelineRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  timeText:{fontSize:12,color:'#6b7280'},
  durationText:{fontSize:12,color:'#6b7280'},
  dateText:{fontSize:12,color:'#4b5563'},
  noRoutes:{textAlign:'center',marginTop:20,fontSize:16},
  saveButton:{position:'absolute',bottom:20,right:20,flexDirection:'row',alignItems:'center',backgroundColor:'#000',paddingHorizontal:16,paddingVertical:12,borderRadius:28},
  homeButton:{position:'absolute',top: 50,left:width*0.35,flexDirection:'row',alignItems:'center',backgroundColor:'#000',paddingHorizontal:16,paddingVertical:12,borderRadius:28},
  saveText:{color:'#fff',fontSize:16,fontWeight:'500',marginLeft:8},


});
