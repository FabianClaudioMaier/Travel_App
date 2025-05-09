import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

// aus regions.json holen wir jetzt ein Objekt mit zwei Feldern:
// - regions: [ { city, region, airport }, … ]
// - airportCoordinates: { BCN: {latitude,…}, … }
import regionsData from '../assets/regions.json';
const { regions, airportCoordinates } = regionsData;

// map Region → Stops (Stadt + Airport-Code)
const regionStopsMap = regions.reduce((acc, { region, city, airport }) => {
  if (!acc[region]) acc[region] = [];
  acc[region].push({ city, airport });
  return acc;
}, {});

// Verkehrsmittel
const MODES = [
  { key: 'driving',   label: 'Auto'      },
  { key: 'bicycling', label: 'Fahrrad'   },
  { key: 'transit',   label: 'Zug/Bus'   },
  { key: 'flight',    label: 'Flug'      }
];

const OVERRIDE_CITY = 'Vienna';

export default function HomeScreen() {
  const nav = useNavigation();

  // --- State für die Schritte, Datum, Modi, Stops etc. (unverändert) ---
  const [step, setStep] = useState(1);
  const [locationLoading, setLocationLoading] = useState(true);
  const [startCity, setStartCity] = useState(null);
  const regionsList = Object.keys(regionStopsMap);
  const [queryRegion, setQueryRegion]     = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [queryStop, setQueryStop]         = useState('');
  const [selectedStop, setSelectedStop]   = useState(null);
  const [stops, setStops]                 = useState([]);
  const [startDate, setStartDate]         = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [endDate, setEndDate]             = useState(new Date());
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedModes, setSelectedModes] = useState([]);
  const [originAirport, setOriginAirport]         = useState(null);
  const [destinationAirport, setDestinationAirport] = useState(null);

  const findAirport = city => {
    const entry = regions.find(r => r.city === city);
    return entry?.airport || 'VIE';  // Fallback: VIE
  };

useEffect(() => {
  (async () => {
    // 1) Permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erlaubnis benötigt', 'Standortzugriff ist erforderlich.');
      setLocationLoading(false);       // ← unbedingt freigeben!
      setStartCity(OVERRIDE_CITY);     // oder ein Fallback
      const code = findAirport(OVERRIDE_CITY);
      setOriginAirport(code);
      setDestinationAirport(code);
      return;
    }

    // 2) Position holen
    let city = OVERRIDE_CITY;          // Standard-Fallback
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const rev = await Location.reverseGeocodeAsync(loc.coords);
      city = rev[0]?.city
          || rev[0]?.region
          || rev[0]?.subregion
          || OVERRIDE_CITY;
      if (city === 'Mountain View') city = OVERRIDE_CITY;
    } catch (e) {
      // city bleibt OVERRIDE_CITY
    }

    // 3) State setzen
    setStartCity(city);
    const code = findAirport(city);
    setOriginAirport(code);
    setDestinationAirport(code);
    setLocationLoading(false);
  })();
}, []);

  // DatePicker-Handler (unverändert)
  const onChangeStart = (e, date) => { setShowStartPicker(false); if (date) setStartDate(date); };
  const onChangeEnd   = (e, date) => { setShowEndPicker(false);   if (date) setEndDate(date);   };

  // Modus umschalten
  const toggleMode = key =>
    setSelectedModes(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );

  // Stops hinzufügen/entfernen
  const addStop = () => {
    if (selectedStop && !stops.find(s => s.city === selectedStop.city) && stops.length < 5) {
      setStops([...stops, selectedStop]);
      setQueryStop('');
      setSelectedStop(null);
    }
  };
  const removeStop = city => setStops(stops.filter(s => s.city !== city));

  // Vorschlags-Listen für Regions & Stops
  const suggestionsRegion = regionsList.filter(r =>
    r.toLowerCase().includes(queryRegion.trim().toLowerCase())
  );
  const suggestionsStop = selectedRegion
    ? regionStopsMap[selectedRegion].filter(({ city }) =>
        city.toLowerCase().includes(queryStop.trim().toLowerCase())
      )
    : [];

  // Schritt-Freigaben
  const canNext = () => {
    switch (step) {
      case 1: return !!selectedRegion;
      case 2: return !!startDate;
      case 3: return !!endDate;
      case 4: return selectedModes.length > 0;
      case 5: return stops.length > 0;
      default: return true;
    }
  };

  // Weiter-Button
  const onNext = () => {
    if (step < 6) {
      setStep(step + 1);
      return;
    }

    // Basispayload
    const payload = {
      origin:      startCity,
      stops:       stops.map(s => s.city),
      destination: startCity,
      modes:       selectedModes,
      originAirport,
      destinationAirport,
      stopsAirport: stops.map(s => findAirport(s.city)),
      airportCoordinates
    };
    nav.navigate('Result', payload);
  };

  const onBack = () => step > 1 && setStep(step - 1);

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Standort wird ermittelt...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      enableOnAndroid
      extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepText}>Schritt {step} von 6</Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>Region auswählen:</Text>
          <TextInput
            style={styles.input}
            placeholder="Region eingeben..."
            value={queryRegion}
            onChangeText={t => { setQueryRegion(t); setSelectedRegion(null); }}
          />
          {queryRegion.length > 0 && (
            <View style={styles.dropdown}>
              {suggestionsRegion.map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => { setQueryRegion(item); setSelectedRegion(item); }}
                >
                  <Text style={styles.item}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Startdatum:</Text>
          <Pressable style={styles.input} onPress={() => setShowStartPicker(true)}>
            <Text>{startDate.toLocaleDateString()}</Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker value={startDate} mode="date" display="default" onChange={onChangeStart} />
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.label}>Enddatum:</Text>
          <Pressable style={styles.input} onPress={() => setShowEndPicker(true)}>
            <Text>{endDate.toLocaleDateString()}</Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker value={endDate} mode="date" display="default" onChange={onChangeEnd} />
          )}
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.label}>Verkehrsmodi:</Text>
          <View style={styles.modesContainer}>
            {MODES.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.modeItem, selectedModes.includes(m.key) && styles.modeSelected]}
                onPress={() => toggleMode(m.key)}
              >
                <Text style={[styles.modeText, selectedModes.includes(m.key) && styles.modeTextSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 5 && (
        <>
          <Text style={styles.label}>Stopps in {selectedRegion}:</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Stopp eingeben..."
              value={queryStop}
              onChangeText={t => { setQueryStop(t); setSelectedStop(null); }}
            />
            <Pressable
              style={[styles.addButton,
                (!selectedStop || stops.find(s => s.city === selectedStop.city) || stops.length >= 5)
                && styles.buttonDisabled
              ]}
              onPress={addStop}
              disabled={!selectedStop || stops.find(s => s.city === selectedStop.city) || stops.length >= 5}
            >
              <Text style={styles.addText}>+</Text>
            </Pressable>
          </View>
          {queryStop.length > 0 && (
            <View style={styles.dropdown}>
              {suggestionsStop.map(item => (
                <TouchableOpacity
                  key={item.city}
                  onPress={() => { setQueryStop(item.city); setSelectedStop(item); }}
                >
                  <Text style={styles.item}>{item.city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {stops.length > 0 && (
            <View style={styles.stopsContainer}>
              {stops.map((stop, i) => (
                <View key={i} style={styles.stopItem}>
                  <Text style={styles.stopText}>{stop.city}</Text>
                  <TouchableOpacity onPress={() => removeStop(stop.city)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {step === 6 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Zusammenfassung:</Text>
          <View style={styles.summaryItem}>
            <Text>Region: {selectedRegion}</Text>
            <Pressable style={styles.editButton} onPress={() => setStep(1)}>
              <Text style={styles.editText}>Bearbeiten</Text>
            </Pressable>
          </View>
          <View style={styles.summaryItem}>
            <Text>Startdatum: {startDate.toLocaleDateString()}</Text>
            <Pressable style={styles.editButton} onPress={() => setStep(2)}>
              <Text style={styles.editText}>Bearbeiten</Text>
            </Pressable>
          </View>
          <View style={styles.summaryItem}>
            <Text>Enddatum: {endDate.toLocaleDateString()}</Text>
            <Pressable style={styles.editButton} onPress={() => setStep(3)}>
              <Text style={styles.editText}>Bearbeiten</Text>
            </Pressable>
          </View>
          <View style={styles.summaryItem}>
            <Text>Verkehrsmodi: {selectedModes.map(m => MODES.find(x => x.key === m).label).join(', ')}</Text>
            <Pressable style={styles.editButton} onPress={() => setStep(4)}>
              <Text style={styles.editText}>Bearbeiten</Text>
            </Pressable>
          </View>
          <View style={styles.summaryItem}>
            <Text>Stopps: {stops.map(s => s.city).join(', ')}</Text>
            <Pressable style={styles.editButton} onPress={() => setStep(5)}>
              <Text style={styles.editText}>Bearbeiten</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navContainer}>
        {step > 1 && (
          <Pressable style={[styles.navButton]} onPress={onBack}>
            <Text style={styles.buttonText}>Zurück</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.navButton, !canNext() && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!canNext()}
        >
          <Text style={styles.buttonText}>{step < 6 ? 'Weiter' : 'Route anzeigen'}</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  stepText: { fontSize: 14, color: '#666', alignSelf: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  modesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  modeItem: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#eee', borderRadius: 20, margin: 4 },
  modeSelected: { backgroundColor: '#007AFF' },
  modeText: { color: '#333' },
  modeTextSelected: { color: '#fff' },
  dropdown: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, backgroundColor: '#fafafa', marginTop: 4 },
  item: { padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addButton: { marginLeft: 8, backgroundColor: '#007AFF', padding: 12, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  stopsContainer: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap' },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, margin: 4 },
  stopText: { marginRight: 6, color: '#333' },
  removeText: { color: '#900', fontWeight: '600' },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  navButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 6, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryContainer: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 },
  summaryTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  editButton: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#007AFF', borderRadius: 4 },
  editText: { color: '#007AFF', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' }
});
