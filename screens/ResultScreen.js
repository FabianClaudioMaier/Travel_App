import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

// Polyline decoder (unchanged)
function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0;
    result = 0;
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

export default function ResultScreen({ route }) {
  const {
    origin,
    stops = [],
    destination,
    modes = [],               // ['transit','flight',…]
    originAirport,            // z.B. 'VIE'
    stopsAirport = [],        // z.B. ['BCN',…]
    destinationAirport,       // z.B. 'VIE'
    airportCoordinates = {},  // Mapping IATA→{latitude,longitude}
    legs: localLegs
  } = route.params;

  // Build coordsMap and ensure VIE present
  const coordsMap = { ...airportCoordinates };
  if (originAirport && !coordsMap[originAirport]) {
    console.warn(`Koordinate fehlt für ${originAirport}, setze manuell.`);
    coordsMap[originAirport] = { latitude: 48.1103, longitude: 16.5697 };
  }
  if (destinationAirport && !coordsMap[destinationAirport]) {
    coordsMap[destinationAirport] = coordsMap[originAirport];
  }

  const hasLocal = Array.isArray(localLegs) && localLegs.length > 0;
  const [finalLegs, setFinalLegs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: Dauer in Sekunden
  const toSeconds = dur => {
    if (typeof dur === 'string') {
      const m = dur.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : Infinity;
    }
    return typeof dur === 'number' ? dur : Infinity;
  };
  // Wähle schnellste Route aus Array
  const pickFastest = arr =>
    arr.length === 0
      ? null
      : arr.reduce((best, r) =>
          toSeconds(r.duration) < toSeconds(best.duration) ? r : best
        , arr[0]);

  // API-Aufrufe
  const fetchLegMode = async (type, from, to) => {
    try {
      console.log(`Fetching ${type}: ${from}->{to}`);
      const url = `https://hci-backend-541730464130.europe-central2.run.app/routes/${type}` +
                  `?origin=${encodeURIComponent(from)}` +
                  `&destination=${encodeURIComponent(to)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      return Array.isArray(json.routes) ? json.routes : [];
    } catch (e) {
      console.warn(`Error fetching ${type}`, e);
      return [];
    }
  };
  const fetchFlights = async (fromCode, toCode) => {
    try {
      console.log(`Fetching flights: ${fromCode}->{toCode}`);
      const url = `https://hci-backend-541730464130.europe-central2.run.app/routes/flights` +
                  `?origin=${encodeURIComponent(fromCode)}` +
                  `&destination=${encodeURIComponent(toCode)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      return Array.isArray(json) ? json : [];
    } catch (e) {
      console.warn('Error fetching flights', e);
      return [];
    }
  };

  // Berechne alle Legs
  const fetchAndCompute = async () => {
    console.log('🏁 fetchAndCompute start');
    console.log(' → origin', origin, 'stops', stops, 'destination', destination);
    console.log(' → modes', modes);

    const names = [origin, ...stops, destination];
    const codes = [originAirport, ...stopsAirport, destinationAirport];
    const useTransit = modes.includes('transit');
    const useFlight  = modes.includes('flight');

    const legsData = await Promise.all(
      names.slice(0, -1).map(async (fromName, i) => {
        const toName = names[i + 1];
        const fromCode = codes[i], toCode = codes[i + 1];

        console.log(`\n–– Leg ${i}: ${fromName} → ${toName}`);
        if (useTransit) console.log('   [transit]');
        if (useFlight)  console.log('   [flight]');

        const candidates = [];

        // Transit: Bus & Train
        if (useTransit) {
          const [busArr, trainArr] = await Promise.all([
            fetchLegMode('buses', fromName, toName),
            fetchLegMode('trains', fromName, toName),
          ]);
          console.log(`   busArr (${busArr.length})`, busArr.map(r => r.duration));
          console.log(`   trainArr (${trainArr.length})`, trainArr.map(r => r.duration));

          const bestBus   = pickFastest(busArr.map(r => ({
            routeData: r,
            duration: r.duration,
            distanceMeters: r.distanceMeters,
            polyline: { encodedPolyline: r.polyline.encodedPolyline }
          })));
          if (bestBus) {
            console.log('   → bestBus:', bestBus.duration, bestBus.distanceMeters);
            candidates.push({ route: bestBus, label: 'Bus' });
          }

          const bestTrain = pickFastest(trainArr.map(r => ({
            routeData: r,
            duration: r.duration,
            distanceMeters: r.distanceMeters,
            polyline: { encodedPolyline: r.polyline.encodedPolyline }
          })));
          if (bestTrain) {
            console.log('   → bestTrain:', bestTrain.duration, bestTrain.distanceMeters);
            candidates.push({ route: bestTrain, label: 'Train' });
          }
        }

        // Flight
        if (useFlight && fromCode && toCode) {
          const flights = await fetchFlights(fromCode, toCode);
          console.log(`   flights (${flights.length})`);
          if (flights.length > 0) {
            const bestF = flights.reduce((b,f) => f.total_distance < b.total_distance ? f : b, flights[0]);
            const flightMins = bestF.path.reduce((sum,p) => sum+p.duration, 0)
                               + bestF.stops_duration.reduce((sum,d) => sum+d, 0)
                               + 180;
            const pA = coordsMap[fromCode], pB = coordsMap[toCode];
            if (pA && pB) {
              console.log(`   → bestFlight: dur=${flightMins*60}, dist=${bestF.total_distance*1000}`);
              candidates.push({
                route: { duration:flightMins*60, distanceMeters:bestF.total_distance*1000, pathPoints:[pA,pB] },
                label:'Flug'
              });
            } else {
              console.warn(`   ✈ coords missing for ${fromCode} or ${toCode}`);
            }
          }
        }

        if (candidates.length===0) {
          console.warn(`   !!! No candidates for ${fromName}→${toName}`);
          return null;
        }
        const bestOverall = candidates.reduce((b,l)=> toSeconds(l.route.duration)<toSeconds(b.route.duration)?l:b, candidates[0]);
        console.log(`   => bestOverall: [${bestOverall.label}] ${bestOverall.route.duration}s, ${(bestOverall.route.distanceMeters/1000).toFixed(1)}km`);
        return bestOverall;
      })
    );

    console.log('\n✅ legsData:', legsData);
    setFinalLegs(legsData);
    setLoading(false);
  };

  useEffect(() => {
    if (hasLocal) {
      console.log('Using local legs', localLegs);
      setFinalLegs(localLegs);
      setLoading(false);
    } else {
      fetchAndCompute();
    }
  }, []);


  // Gesamtwerte für Save
  const totalDurationSec = finalLegs.reduce(
    (sum, l) => l ? sum + toSeconds(l.route.duration) : sum, 0
  );
  const totalDistanceKm = finalLegs.reduce(
    (sum, l) => l ? sum + (l.route.distanceMeters / 1000) : sum, 0
  );
  const hasAnyLeg = finalLegs.some(l => l);

  const onSave = async () => {
    if (!hasAnyLeg) {
      Alert.alert('Fehler', 'Keine Route zum Speichern vorhanden.');
      return;
    }
    const record = {
      id: Date.now(),
      origin, stops, destination,
      totalDurationSec, totalDistanceKm,
      legs: finalLegs
    };
    try {
      const json = await AsyncStorage.getItem('myTravels');
      const arr = json ? JSON.parse(json) : [];
      arr.push(record);
      await AsyncStorage.setItem('myTravels', JSON.stringify(arr));
      Alert.alert('Gespeichert', 'Deine Route wurde unter MyTravels abgelegt.');
    } catch {
      Alert.alert('Fehler', 'Beim Speichern ist etwas schiefgelaufen.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // Anzeige einer Leg-Karte
  const renderRouteCard = ({ route: item, label }, idx) => {
    if (!item) return null;
    // Koordinaten: bei Flug eigene pathPoints, sonst decodierte Polyline
    const coords = item.pathPoints
      ? item.pathPoints
      : decodePolyline(item.polyline.encodedPolyline);

    const secs = toSeconds(item.duration);
    // Map-Bounds
    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2 || 0.05;
    const deltaLng = (maxLng - minLng) * 1.2 || 0.05;

    return (
      <View key={idx} style={styles.card}>
        <Text style={styles.routeLabel}>
          {label} — {Math.floor(secs/3600)}h {Math.floor((secs%3600)/60)}m — {(item.distanceMeters/1000).toFixed(1)} km
        </Text>
        <MapView
          style={styles.map}
          initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng }}
        >
          <Polyline coordinates={coords} strokeWidth={4} />
        </MapView>
        {/* Transit-Details nur für Bus/Zug */}
        {label !== 'Flug' && item.routeData?.legs?.map((leg, i) => (
          <View key={i} style={styles.step}>
            {leg.steps?.map((step,j) => {
              const td = step.transitDetails;
              if (!td?.stopDetails) return null;
              const { stopDetails, localizedValues, transitLine } = td;
              return (
                <View key={j}>
                  <Text>
                    {localizedValues.departureTime.time.text} → {localizedValues.arrivalTime.time.text}
                  </Text>
                  <Text>
                    From {stopDetails.departureStop.name} to {stopDetails.arrivalStop.name}
                  </Text>
                  <Text>
                    Line: {transitLine.nameShort||transitLine.name} ({transitLine.vehicle.name.text}, stops {td.stopCount})
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Routeübersicht</Text>
      {finalLegs.map((leg, idx) => leg ? renderRouteCard(leg, idx) : null)}
      {!hasAnyLeg && (
        <Text style={{ textAlign:'center', marginTop:20 }}>Keine Routen verfügbar</Text>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Icon name="save-outline" size={24} color="#fff"/>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 10 },
  header:     { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card:       { backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 2 },
  routeLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  map:        { height: 150, borderRadius: 8, marginVertical: 5 },
  step:       { marginTop: 5, paddingVertical: 5, borderTopWidth:1, borderColor:'#eee' },
  saveButton: {
    position:'absolute', bottom:20, right:20,
    backgroundColor:'#007AFF', width:56, height:56, borderRadius:28,
    justifyContent:'center', alignItems:'center', elevation:4
  }
});
