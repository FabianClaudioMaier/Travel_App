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
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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
  id?: string;             // aus ProfileScreen
  origin?: string;         // aus SearchScreen
  originAirport?: string;
  stops?: string;          // CSV
  stopsAirport?: string;   // CSV
  modes?: string;          // CSV
  start_date?: string;
  end_date?: string;
  price?: string;
}

const { width } = Dimensions.get('window');

// --- Polyline Decoder ---
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

// --- Helpers ---
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
  console.warn('unwrapArray konnte kein Array finden, raw=', raw);
  return [];
}

// --- Fetch Functions ---
const fetchLegMode = async (
  type: 'buses' | 'trains',
  from: string,
  to: string
): Promise<RouteInfo[]> => {
  console.log(`→ fetchLegMode ${type} "${from}" → "${to}"`);
  try {
    const raw = type === 'buses'
      ? await api.routes.getBusRoutes(from, to)
      : await api.routes.getTrains(from, to);
    console.log(`← raw ${type}:`, raw);
    const arr: TransitRoute[] = unwrapArray(raw);
    return arr.map(r => ({
      duration: toSeconds(r.duration),
      distanceMeters: r.distanceMeters,
      encodedPolyline: r.polyline.encodedPolyline,
      raw: r,
    }));
  } catch (e: any) {
    console.error(`✕ Error fetching ${type}:`, e.response?.status ?? e.message);
    return [];
  }
};

const fetchFlights = async (
  fromCode: string,
  toCode: string
): Promise<RouteInfo[]> => {
  console.log(`→ fetchFlights "${fromCode}" → "${toCode}"`);
  try {
    const raw = await api.routes.getFlights(fromCode, toCode);
    console.log('← raw flights:', raw);
    const flights: Flight[] = unwrapArray(raw);
    return flights.map(f => {
      const secs = f.path.reduce((s, seg) => s + seg.duration, 0)
        + f.stops_duration.reduce((s, d) => s + d, 0)
        + 3 * 3600;
      return {
        duration: secs,
        distanceMeters: f.total_distance * 1000,
        encodedPolyline: f.encoded_polyline,
        raw: f,
      };
    });
  } catch (e: any) {
    console.error('✕ Error fetching flights:', e.response?.status ?? e.message);
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
  console.log(`→ getBestLeg ${fromName}→${toName}`, { fromAirport, toAirport, modes });
  const candidates: RouteInfo[] = [];
  if (modes.includes('bus'))    candidates.push(...await fetchLegMode('buses', fromName, toName));
  if (modes.includes('train'))  candidates.push(...await fetchLegMode('trains', fromName, toName));
  if (modes.includes('flight') && fromAirport && toAirport) {
    candidates.push(...await fetchFlights(fromAirport, toAirport));
  }
  console.log(`→ candidates:`, candidates.length);
  if (!candidates.length) return null;
  const best = candidates.reduce((a, b) => a.duration < b.duration ? a : b);
  let label: 'Bus' | 'Train' | 'Flight' = 'Bus';
  if ((best.raw as any)?.encoded_polyline) label = 'Flight';
  else if ((best.raw as any)?.legs)       label = 'Train';
  return { route: best, label };
}

function permute<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const res: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const head = items[i];
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const p of permute(rest)) res.push([head, ...p]);
  }
  return res;
}

// --- LegCard Component ---
interface LegCardProps {
  leg: { label: 'Flight' | 'Bus' | 'Train'; route: RouteInfo };
  originCity: string;
  destCity: string;
  date?: string;
}
const LegCard: React.FC<LegCardProps> = ({ leg, originCity, destCity, date }) => {
  const { label, route } = leg;
  const hours = Math.floor(route.duration / 3600);
  const mins  = Math.floor((route.duration % 3600) / 60);
  const h0 = Math.floor(Math.random() * 24);
  const m0 = Math.floor(Math.random() * 60);
  const start = `${h0.toString().padStart(2,'0')}:${m0.toString().padStart(2,'0')}`;
  const endHour   = (h0 + hours + ((m0+mins)>59?1:0)) % 24;
  const endMins   = (m0 + mins) % 60;
  const end       = `${endHour.toString().padStart(2,'0')}:${endMins.toString().padStart(2,'0')}`;
  const airline   = route.raw?.path?.[0]?.airline ?? '';
  const priceText = route.raw?.price ? `€ ${route.raw.price}` : '';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Icon
          name={label==='Flight'?'airplane-outline':label==='Bus'?'bus-outline':'train-outline'}
          size={24} color="#111"
        />
        <Text style={styles.productName}>{`${label} ${originCity} - ${destCity}`}</Text>
      </View>
      <View style={styles.subRow}>
        <Text style={styles.subText}>{airline}</Text>
        <Text style={styles.subText}>{priceText}</Text>
      </View>
      <View style={styles.divider}/>
      <View style={styles.timelineRow}>
        <Text style={styles.timeText}>{start}</Text>
        <Icon name="arrow-forward-outline" size={16}/>
        <Text style={styles.durationText}>{`${hours}h ${mins}m`}</Text>
        <Icon name="arrow-forward-outline" size={16} style={{transform:[{rotate:'180deg'}]}}/>
        <Text style={styles.timeText}>{end}</Text>
      </View>
      {date && <Text style={styles.dateText}>{date}</Text>}
    </View>
  );
};

// --- ResultScreen ---
export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  console.log('🏁 [ResultScreen] params:', params);

  // States für ID- und Search-Branch
  const [loading, setLoading]               = useState(true);
  const [origin, setOrigin]                 = useState('');
  const [destination, setDestination]       = useState('');
  const [originAirport, setOriginAirport]   = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [stops, setStops]                   = useState<string[]>([]);
  const [stopsAirport, setStopsAirport]     = useState<string[]>([]);
  const [modes, setModes]                   = useState<string[]>([]);
  const [rawStart, setRawStart]             = useState<string|undefined>(undefined);
  const [rawEnd, setRawEnd]                 = useState<string|undefined>(undefined);
  const [startDate, setStartDate]           = useState<Date|undefined>(undefined);
  const [endDate, setEndDate]               = useState<Date|undefined>(undefined);
  const [priceLimit, setPriceLimit]         = useState<number>(Infinity);
  const [finalLegs, setFinalLegs]           = useState<(Leg|null)[]>([]);
  const [cards, setCards]                   = useState<LegCardProps[]>([]);

  useEffect(() => {
    (async () => {
      // — FALL 1: Laden per ID —
      if (params.id) {
        console.log('ℹ️ Loading trip id=', params.id);
        try {
          const json = await AsyncStorage.getItem('myTravels');
          const arr  = json ? JSON.parse(json) : [];
          const rec  = arr.find((r: any) => r.id === params.id);
          if (!rec) {
            Alert.alert('Fehler','Reise nicht gefunden');
          } else {
            console.log('← Found record:', rec);
            setOrigin(rec.origin);
            setDestination(rec.destination);
            setOriginAirport(rec.originAirport||'');
            setDestinationAirport(rec.destinationAirport||'');
            setStops(rec.stops||[]);
            setStopsAirport(rec.stopsAirport||[]);
            setModes(rec.modes||[]);
            setRawStart(rec.start_date);
            setStartDate(rec.start_date ? new Date(rec.start_date) : undefined);
            setRawEnd(rec.end_date);
            setEndDate(rec.end_date ? new Date(rec.end_date) : undefined);
            setPriceLimit(typeof rec.priceLimit==='number'?rec.priceLimit:Infinity);
            setFinalLegs(rec.legs||[]);
          }
        } catch(e){
          console.error('✕ Cache load failed', e);
        } finally {
          setLoading(false);
        }
        return;
      }

      // — FALL 2: Berechnung per Search-Params —
      console.log('ℹ️ Computing via search params');
      const o  = params.origin!;
      const oa = params.originAirport ?? '';
      const s  = params.stops?.split(',') ?? [];
      const sa = params.stopsAirport?.split(',') ?? [];
      const m  = params.modes?.split(',') ?? [];
      const rs = params.start_date;
      const re = params.end_date;
      const pl = params.price ? Number(params.price) : Infinity;

      setOrigin(o);
      setDestination(o);
      setOriginAirport(oa);
      setDestinationAirport(oa);
      setStops(s);
      setStopsAirport(sa);
      setModes(m);
      setRawStart(rs);
      setStartDate(rs?new Date(rs):undefined);
      setRawEnd(re);
      setEndDate(re?new Date(re):undefined);
      setPriceLimit(pl);

      try {
        const perms = permute(s);
        console.log('→ Permutations:', perms.length, perms);
        let bestOverall: { legs:(Leg|null)[]; time:number; price:number }|null = null;

        for (const perm of perms) {
          console.log(' → Sequence:', [o, ...perm, o]);
          const seqCities   = [o, ...perm, o];
          const seqAirports = [oa, ...perm.map((_,i)=>sa[i]||''), oa];
          let sumTime = 0, sumPrice = 0;
          const legs: (Leg|null)[] = [];

          for (let i=0; i<seqCities.length-1; i++){
            const leg = await getBestLeg(
              seqCities[i], seqCities[i+1],
              seqAirports[i], seqAirports[i+1],
              m
            );
            console.log('   ↳ leg:', leg);
            if (!leg) { sumTime = Infinity; break; }
            sumTime   += leg.route.duration;
            sumPrice  += (leg.label==='Flight'?leg.route.raw.price:0);
            legs.push(leg);
          }
          if (sumTime===Infinity) continue;
          if (!bestOverall
            || (sumPrice<=pl && sumTime<bestOverall.time)
            || (bestOverall.price>pl && sumPrice<bestOverall.price)
          ) {
            bestOverall = { legs, time: sumTime, price: sumPrice };
          }
        }
        if (bestOverall) {
          console.log('← BestOverall:', bestOverall);
          setFinalLegs(bestOverall.legs);
        } else {
          console.log('← No valid route found');
        }
      } catch(e){
        console.error('✕ Computation failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, params.origin, params.originAirport, params.modes, params.start_date, params.end_date, params.stops, params.price, params.people]);

  // — Karten-Daten aufbereiten —
  useEffect(() => {
    if (!finalLegs.length) return;
    console.log('▶️ Building display cards');
    const seqCities   = [origin, ...stops, destination];
    const seqAirports = [originAirport, ...stopsAirport, destinationAirport];
    const cardData: LegCardProps[] = finalLegs
      .map((leg,i)=> leg
        ? { label: leg.label, route: leg.route, originCity: seqCities[i], destCity: seqCities[i+1], date: startDate?.toLocaleDateString() }
        : null
      )
      .filter((c): c is LegCardProps => !!c);
    console.log('← cardData:', cardData);
    setCards(cardData);
  }, [finalLegs]);

  if (loading) {
    console.log('… still loading');
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  // — Render —
  const allCoords = finalLegs
    .filter(Boolean)
    .flatMap(leg => decodePolyline((leg as Leg).route.encodedPolyline));
  const lats = allCoords.map(c => c.latitude);
  const lngs = allCoords.map(c => c.longitude);
  const midLat = (Math.min(...lats)+Math.max(...lats))/2;
  const midLng = (Math.min(...lngs)+Math.max(...lngs))/2;
  const deltaLat = (Math.max(...lats)-Math.min(...lats))*1.2||0.05;
  const deltaLng = (Math.max(...lngs)-Math.min(...lngs))*1.2||0.05;
  const markers = allCoords.length
    ? [
        { coordinate: allCoords[0], label:'Origin' },
        ...finalLegs.filter(Boolean).slice(0,-1).map((leg,i)=>{
          const pts = decodePolyline((leg as Leg).route.encodedPolyline);
          return { coordinate: pts[pts.length-1], label:`Stop ${i+1}` };
        }),
        { coordinate: allCoords[allCoords.length-1], label:'Destination' }
      ]
    : [];

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Routeübersicht</Text>
        {startDate && endDate && (
          <View style={styles.summaryContainer}>
            <Text>{`Reisedaten: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`}</Text>
          </View>
        )}
        {allCoords.length>0 && (
          <MapView
            style={styles.overallMap}
            initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta:deltaLat, longitudeDelta:deltaLng }}
          >
            <Polyline coordinates={allCoords} strokeWidth={4}/>
            {markers.map((m,i)=><Marker key={i} coordinate={m.coordinate}/>)}
          </MapView>
        )}
        {cards.map((c,idx)=>
          <LegCard key={idx} leg={{label:c.label,route:c.route}} originCity={c.originCity} destCity={c.destCity} date={c.date}/>
        )}
        {!cards.length && <Text style={styles.noRoutes}>Keine Routen verfügbar</Text>}
      </ScrollView>
      <TouchableOpacity style={styles.saveButton} onPress={async ()=>{
        const rec={ id: uuidv4(), origin, originAirport, stops, stopsAirport, destination, destinationAirport, modes, start_date:startDate, end_date:endDate, price:priceLimit, legs:finalLegs };
        try {
          const js= await AsyncStorage.getItem('myTravels');
          const arr= js?JSON.parse(js):[];
          arr.push(rec);
          await AsyncStorage.setItem('myTravels',JSON.stringify(arr));
          Alert.alert('Erfolg','Route gespeichert');
        } catch(e){ Alert.alert('Fehler','Speichern fehlgeschlagen'); }
      }}>
        <Icon name="save-outline" size={20} color="#fff"/>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:10 },
  loader:    { flex:1, justifyContent:'center' },
  header:    { fontSize:20, fontWeight:'bold', marginBottom:10 },
  summaryContainer:{ marginBottom:10 },
  overallMap:{ height:width*0.8, borderRadius:10, marginBottom:10, borderColor:'#000',borderWidth:2 },
  cardContainer:{ backgroundColor:'#fff',borderRadius:8,borderWidth:1,borderColor:'#6c757d',padding:12,marginBottom:12 },
  headerRow:{ flexDirection:'row',alignItems:'center',gap:8 },
  productName:{ fontSize:14,fontWeight:'500',flex:1 },
  subRow:{ flexDirection:'row',justifyContent:'space-between',marginTop:6 },
  subText:{ fontSize:14,color:'rgba(0,0,0,0.5)' },
  divider:{ height:1,backgroundColor:'#e6e6e6',marginVertical:8 },
  timelineRow:{ flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  timeText:{ fontSize:12,color:'#6b7280' },
  durationText:{ fontSize:12,color:'#6b7280' },
  dateText:{ position:'absolute',top:12,right:12,fontSize:12,color:'#4b5563' },
  noRoutes:{ textAlign:'center',marginTop:20,fontSize:16 },
  saveButton:{ position:'absolute',bottom:20,right:20,flexDirection:'row',alignItems:'center',backgroundColor:'#000',paddingHorizontal:16,paddingVertical:12,borderRadius:28 },
  saveText:{ color:'#fff',fontSize:16,fontWeight:'500',marginLeft:8 }
});
