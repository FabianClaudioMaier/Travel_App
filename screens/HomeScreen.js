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
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-swiper';
import InputDatePicker from '../components/InputDatePicker';
import MaximalPrice from '../components/MaximalPrice';
import NumberOfPeople from '../components/NumberOfPeople.js';



// Device dimensions for responsive layout
const { width, height } = Dimensions.get('window');

// Background images and their descriptions for the carousel
const bgImages = [
  require('../assets/beach.webp'),
  require('../assets/countryside.webp'),
  require('../assets/greek-coast-sunshine.webp'),
  require('../assets/mountain-scenery-morning-sun-rays-4k.jpg')
];
const bgImagesDescription = [
  {
    title: 'Cliffs of Dover',
    text:  'Marvel the beauty of England\'s south coast and wander along the cliff\'s edge',
  },
  {
    title: 'Swiss Alps',
    text:  'Chocolate, Cheese and endless Charm. The 3 Cs\' that make the Swiss Alpine region absolutely stunning',
  },
  {
    title: 'Aegean Islands',
    text:  'Since Antiquity this region represents the ',
  },
  {
    title: 'The Valleys of California',
    text:  '',
  }
];

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
  { key: 'bus',         label: 'Bus'       },
  { key: 'train',       label: 'Train'     },
  { key: 'flight',      label: 'Airplane'  }
];

const OVERRIDE_CITY = 'Vienna';

export default function HomeScreen() {
  const nav = useNavigation();

  // --- State für die Schritte, Datum, Modi, Stops etc. (unverändert) ---
  const [step, setStep] = useState(0);
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
  const [showEndDate, setShowEndDate] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);


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
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeInterval: 10000,       // für watchPositionAsync
        maximumAge: 10000,         // max. Cache - 10 Sek.
        enableHighAccuracy: true,  // falls unterstützt
      });
      const rev = await Location.reverseGeocodeAsync(loc.coords);
      city = rev[0]?.city
          || rev[0]?.region
          || rev[0]?.subregion
          || OVERRIDE_CITY;
      if (city === 'Wien') city = OVERRIDE_CITY;
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
      case 0: return !!selectedRegion
      case 1: return numberOfAdults + numberOfChildren > 0;
      case 2: return !!endDate;
      case 3: return maxPrice > 0;
      case 4: return stops.length > 0;
      case 5: return selectedModes.length > 0;
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

  const onBack = () => step > 0 && setStep(step - 1);

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' />
        <Text style={styles.loadingText}>Standort wird ermittelt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundSwiper}>
        <Swiper
            style={{ height }}
            autoplay
            autoplayTimeout={5}
            showsPagination={false}
            loop
        >
            {bgImages.map((img, idx) => (
              <View key={idx} style={styles.slide}>
                <Image
                  source={img}
                  style={styles.backgroundImage}
                  resizeMode='cover'
                />
                <View style={styles.descriptionOverlay}>
                  <Text style={styles.descriptionTitle}>
                    {bgImagesDescription[idx].title}
                  </Text>
                  <Text style={styles.descriptionText}>
                    {bgImagesDescription[idx].text}
                  </Text>
                </View>
              </View>
            ))}
        </Swiper>
      </View>
      <KeyboardAwareScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
      >
        <View style={styles.stepsContainer}>
          {step > 0 && (
            <>
              <Text style={[styles.labelSettingsBoxTitle, {marginTop: 8}]} numberOfLines={1}>
                    Your Trip to: {selectedRegion}
              </Text>
              <Text style={[styles.stepText, {marginTop: 8}]}>
                Step {step} out of 5
              </Text>
            </>
          )}
          {step === 0 && (
            <>
              <TextInput
                style={[styles.inputTextContainer,styles.inputText]}
                placeholder='Choose a region...'
                value={queryRegion}
                onChangeText={t => { setQueryRegion(t); setSelectedRegion(null); setShowDropdown(true)}}
              />
              {queryRegion.length > 0 && showDropdown && (
                <View style={styles.dropdown}>
                  {suggestionsRegion.map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => { setQueryRegion(item); setSelectedRegion(item); setShowDropdown(false)}}
                    >
                      <Text style={styles.item}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
          {step === 1 && (
             <View style={[styles.search, styles.searchFlexBox]}>
               <Text style={[styles.labelStepTitle, styles.labelFlexBox]}>
                 How many People?
               </Text>
               <NumberOfPeople
                 numberOfAdults={numberOfAdults}
                 onChangeNumberOfAdults={setNumberOfAdults}
                 numberOfChildren={numberOfChildren}
                 onChangeNumberOfChildren={setNumberOfChildren}
               />
             </View>
          )}
          {step === 2 && (
            <View style={[styles.search, styles.searchFlexBox]}>
              {/* Title */}
              <Text style={[styles.labelStepTitle, styles.labelFlexBox]} numberOfLines={1}>
                When will you travel?
              </Text>
              <InputDatePicker
                startDate={startDate}
                endDate={endDate}
                showStartPicker={showStartPicker}
                showEndPicker={showEndPicker}
                onStartPress={() => setShowStartPicker(true)}
                onEndPress={() => setShowEndPicker(true)}
                onChangeStart={(e, date) => {
                  setShowStartPicker(false);
                  date && setStartDate(date);
                }}
                onChangeEnd={(e, date) => {
                  setShowEndPicker(false);
                  date && setEndDate(date);
                }}
              />
            </View>
          )}
          {step === 3 && (
           <View style={[styles.search, styles.searchFlexBox]}>
             <Text style={[styles.labelStepTitle, styles.labelFlexBox]}>
               Maximaler Preis
             </Text>
             <MaximalPrice
               maxPrice={maxPrice}
               onChange={setMaxPrice}
             />
           </View>
          )}

          {step === 5 && (
            <View style={[styles.search, styles.searchFlexBox]}>
                  {/* Title */}
                  <Text style={[styles.labelStepTitle, styles.labelFlexBox]} numberOfLines={1}>
                    What modes?
                  </Text>
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
            </View>
          )}

          {step === 4 && (
            <View style={[styles.search, styles.searchFlexBox]}>
             <Text style={[styles.labelStepTitle, styles.labelFlexBox]}>
               Which places will you visit?
             </Text>
              <Text style={styles.label}>Choose your prefered sites in {selectedRegion}:</Text>
              <View style={[styles.row,styles.inputTextContainer]}>
                <TextInput
                  style={[styles.inputText, { flex: 1 }]}
                  placeholder='Stopp eingeben...'
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
                  <Text style={styles.addText}>Add</Text>
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
            </View>
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
            {step > 0 && (
              <Pressable style={[styles.navButton]} onPress={onBack}>
                <Text style={styles.buttonText}>Zurück</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.navButton, !canNext() && styles.buttonDisabled]}
              onPress={onNext}
              disabled={!canNext()}
            >
              <Text style={styles.buttonText}>
                {step == 6 ?
                    'Route anzeigen' :
                    step == 0 ?
                      'Suche Starten' : 'Weiter'
                }
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',   // für den Root-View
  },
  scrollArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backgroundSwiper: {
    ...StyleSheet.absoluteFillObject,
    zIndex : -1
  },
  slide: {
    width,
    height,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    height,
    width,
    alignSelf: 'center',
  },
  descriptionOverlay: {
    position: 'absolute',
    bottom: height * 0.2,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#fff',
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    color: "#000",
    alignSelf: 'center',
    overflow: "hidden",
    width: 134,
    height: 28,
    opacity: 0.7
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    color: "#000",
    textAlign: "left",
    alignSelf: "center",
    overflow: "hidden",
    opacity: 0.7
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  modeItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 4
  },
  modeSelected: {
    backgroundColor: '#aaa'
  },
  modeText: {
    color: '#333'
  },
  modeTextSelected: {
    color: '#fff'
  },
  dropdown: {
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: {
        width: 0,
        height: 1
    },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
    borderRadius: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 0,
    width: "80%",
    flex: 1
  },
  item: {
    padding: 8,
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    fontFamily: "Roboto-Regular",
    color: "#000",
    textAlign: "left",
    alignSelf: "stretch"
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  addButton: {
    margin:4,
    width: "18%",
    backgroundColor: '#aaa',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  stopsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    margin: 4
  },
  stopText: {
    marginRight: 6,
    color: '#000'
  },
  removeText: {
    color: '#000',
    fontWeight: '600'
  },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24},
  navButton: { backgroundColor: '#aaa', padding: 14, borderRadius: 6, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  buttonDisabled: { backgroundColor: '#ccc', borderColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryContainer: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 },
  summaryTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  editButton: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#007AFF', borderRadius: 4 },
  editText: { color: '#007AFF', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    borderRadius: 10,
    paddingVertical: 8,
  },
  padding: {paddingVertical: 10},
  scrollArea: {
    flex: 1,
    backgroundColor: 'transparent',  // damit der Swiper durchscheint
  },
  labelStepTitle: {
      padding:10,
      fontSize: 26,
      fontWeight: "1000",
      fontFamily: "Inter-Bold",
      color: "#000",
      alignSelf: 'center'
  },
  labelSettingsBoxTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    color: "#000",
    alignSelf: 'center',
    overflow: "hidden",
  },
  inputTextContainer: {
    borderRadius: 4,
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    width: "100%",
    flex: 1,
    alignSelf: "stretch"
  },
  inputText: {
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    fontFamily: "Roboto-Regular",
    color: "#000",
    textAlign: "left"
  },

});
