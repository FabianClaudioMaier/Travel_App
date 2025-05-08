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
  const { origin, stops = [], destination, legs: localLegs } = route.params;
  const hasLocal = Array.isArray(localLegs) && localLegs.length > 0;

  const [finalLegs, setFinalLegs] = useState([]);
  const [loading, setLoading] = useState(true);

  // duration helper
  const toSeconds = (dur) => {
    if (typeof dur === 'string') {
      const m = dur.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : Infinity;
    }
    return typeof dur === 'number' ? dur : Infinity;
  };

  // pick fastest in an array
  const pickFastest = (arr) =>
    arr.length === 0
      ? null
      : arr.reduce((best, r) =>
          toSeconds(r.duration) < toSeconds(best.duration) ? r : best
        , arr[0]);

  // für Online-Fetch: hole alle legs und berechne Fastest pro Leg
  const fetchAndCompute = async () => {
    const segments = [origin, ...stops, destination].filter(Boolean);
    // für jeden Leg beide Modi abfragen
    const legsData = await Promise.all(
      segments.slice(0, -1).map(async (from, i) => {
        const to = segments[i+1];
        const fetchType = async (type) => {
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
        const [busArr, trainArr] = await Promise.all([
          fetchType('buses'),
          fetchType('trains'),
        ]);
        // schnellste Route auswählen
        const bestBus   = pickFastest(busArr);
        const bestTrain = pickFastest(trainArr);
        if (bestBus && bestTrain) {
          return toSeconds(bestBus.duration) <= toSeconds(bestTrain.duration)
            ? { route: bestBus,   label: 'Bus' }
            : { route: bestTrain, label: 'Train' };
        }
        if (bestBus)   return { route: bestBus,   label: 'Bus' };
        if (bestTrain) return { route: bestTrain, label: 'Train' };
        return null;
      })
    );
    setFinalLegs(legsData);
    setLoading(false);
  };

  useEffect(() => {
    if (hasLocal) {
      // direkt aus lokalen Daten anzeigen
      setFinalLegs(localLegs);
      setLoading(false);
    } else {
      fetchAndCompute();
    }
  }, []);

  // Gesamtdauer und -Distanz für Save-Button
  const totalDurationSec = finalLegs.reduce((sum, l) =>
    l ? sum + toSeconds(l.route.duration) : sum, 0
  );
  const totalDistanceKm = finalLegs.reduce((sum, l) =>
    l ? sum + l.route.distanceMeters / 1000 : sum, 0
  );
  const hasAnyLeg = finalLegs.some(l => l && l.route);

  // Speichern
  const onSave = async () => {
    if (!hasAnyLeg) {
      Alert.alert('Fehler', 'Keine Route zum Speichern vorhanden.');
      return;
    }
    const record = {
      id: Date.now(),
      origin,
      stops,
      destination,
      totalDurationSec,
      totalDistanceKm,
      legs: finalLegs
    };
    try {
      const json    = await AsyncStorage.getItem('myTravels');
      const travels = json ? JSON.parse(json) : [];
      travels.push(record);
      await AsyncStorage.setItem('myTravels', JSON.stringify(travels));
      Alert.alert('Gespeichert', 'Deine Route wurde unter MyTravels abgelegt.');
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Beim Speichern ist etwas schiefgelaufen.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // Einzelne Leg-Karte
  const renderRouteCard = ({ route: item, label }, idx) => {
    if (!item || !item.polyline?.encodedPolyline) return null;
    const secs   = toSeconds(item.duration);
    const coords = decodePolyline(item.polyline.encodedPolyline);

    // Bounds errechnen
    const lats   = coords.map(c => c.latitude);
    const lngs   = coords.map(c => c.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2 || 0.05;
    const deltaLng = (maxLng - minLng) * 1.2 || 0.05;

    return (
      <View key={idx} style={styles.card}>
        <Text style={styles.routeLabel}>
          {label} — {Math.floor(secs/3600)}h {Math.floor((secs % 3600)/60)}m — {(item.distanceMeters/1000).toFixed(1)} km
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
        {item.legs?.map((leg, i) => (
          <View key={i} style={styles.step}>
            {leg.steps?.map((step, j) => {
              const td = step.transitDetails;
              if (!td?.stopDetails) return null;
              const { stopDetails, localizedValues, transitLine } = td;
              return (
                <View key={j}>
                  <Text>
                    {localizedValues.departureTime.time.text}
                    {' → '}
                    {localizedValues.arrivalTime.time.text}
                  </Text>
                  <Text>
                    From {stopDetails.departureStop.name}
                    {' to '}
                    {stopDetails.arrivalStop.name}
                  </Text>
                  <Text>
                    Line: {transitLine.nameShort || transitLine.name} (
                    {transitLine.vehicle.name.text}, stops {td.stopCount})
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
      {finalLegs.map((legObj, idx) =>
        legObj ? renderRouteCard(legObj, idx) : null
      )}
      {!hasAnyLeg && (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No routes available
        </Text>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Icon name="save-outline" size={24} color="#fff" />
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
  step:       { marginTop: 5, paddingVertical: 5, borderTopWidth: 1, borderColor: '#eee' },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
