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
import StepIndicator from 'react-native-step-indicator';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';

// Components
import InputDatePicker, { InputDatePickerProps } from '../components/InputDatePicker';
import MaximalPrice from '../components/MaximalPrice';
import NumberOfPeople from '../components/NumberOfPeople';

const { width, height } = Dimensions.get('window');

// Assets
const bgImages = [
  require('../assets/images/beach.png'),
  require('../assets/images/countryside.png'),
  require('../assets/images/greek-coast-sunshine.png'),
  require('../assets/images/mountain.jpg'),
];
const bgImagesDescription = [
  { title: 'Cliffs of Dover', text: "Marvel the beauty..." },
  { title: 'Swiss Alps', text: 'Chocolate, Cheese and endless Charm...' },
  { title: 'Aegean Islands', text: 'Since Antiquity...' },
  { title: 'Valleys of California', text: '' },
];

// Data
import regionsData from '../assets/data/regions.json';
const { regions, airportCoordinates } = regionsData;
const regionStopsMap = regions.reduce((acc: any, { region, city, airport }) => {
  if (!acc[region]) acc[region] = [];
  acc[region].push({ city, airport });
  return acc;
}, {});

const MODES = [
  { key: 'bus', label: 'Bus' },
  { key: 'train', label: 'Train' },
  { key: 'flight', label: 'Airplane' },
];
const OVERRIDE_CITY = 'Vienna';

// Step Indicator labels & styles
const labels = [
  'Region',
  'People',
  'Dates',
  'Price',
  'Stops',
  'Modes',
  'Summary',
];
const stepIndicatorStyles = {
  stepIndicatorSize: 25,
  currentStepIndicatorSize: 30,
  separatorStrokeWidth: 2,
  currentStepStrokeWidth: 3,
  stepStrokeCurrentColor: '#007AFF',
  stepStrokeWidth: 2,
  stepStrokeFinishedColor: '#007AFF',
  stepStrokeUnFinishedColor: '#aaaaaa',
  separatorFinishedColor: '#007AFF',
  separatorUnFinishedColor: '#aaaaaa',
  stepIndicatorFinishedColor: '#007AFF',
  stepIndicatorUnFinishedColor: '#ffffff',
  stepIndicatorCurrentColor: '#ffffff',
  stepIndicatorLabelFontSize: 10,
  currentStepIndicatorLabelFontSize: 10,
  labelColor: '#999999',
  labelSize: 1,
};

export default function HomeScreen() {
  const router = useRouter();
  // States
  const [step, setStep] = useState<number>(0);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [startCity, setStartCity] = useState<string | null>(null);
  const regionsList = Object.keys(regionStopsMap);
  const [queryRegion, setQueryRegion] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [queryStop, setQueryStop] = useState<string>('');
  const [selectedStop, setSelectedStop] = useState<{ city: string; airport: string } | null>(null);
  const [stops, setStops] = useState<Array<{ city: string; airport: string }>>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [originAirport, setOriginAirport] = useState<string | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [numberOfAdults, setNumberOfAdults] = useState<number>(1);
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0);

  const findAirport = (city: string) => {
    const entry = regions.find(r => r.city === city);
    return entry?.airport || 'VIE';
  };

  // Location effect
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erlaubnis benötigt', 'Standortzugriff ist erforderlich.');
        setLocationLoading(false);
        setStartCity(OVERRIDE_CITY);
        const code = findAirport(OVERRIDE_CITY);
        setOriginAirport(code);
        setDestinationAirport(code);
        return;
      }
      let city = OVERRIDE_CITY;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const rev = await Location.reverseGeocodeAsync(loc.coords);
        city = rev[0]?.city || rev[0]?.region || OVERRIDE_CITY;
        city === 'Wien' ? city = OVERRIDE_CITY : null;
      } catch {}
      setStartCity(city);
      const code = findAirport(city);
      setOriginAirport(code);
      setDestinationAirport(code);
      setLocationLoading(false);
    })();
  }, []);

  // Handlers
  const onChangeStart = (_e: any, date?: Date) => { setShowStartPicker(false); date && setStartDate(date); };
  const onChangeEnd = (_e: any, date?: Date) => { setShowEndPicker(false); date && setEndDate(date); };
  const toggleMode = (key: string) => setSelectedModes(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  const addStop = () => { if (selectedStop && !stops.find(s => s.city === selectedStop.city) && stops.length < 5) { setStops([...stops, selectedStop]); setQueryStop(''); setSelectedStop(null); }};
  const removeStop = (city: string) => setStops(stops.filter(s => s.city !== city));

  const suggestionsRegion = regionsList.filter(r => r.toLowerCase().includes(queryRegion.trim().toLowerCase()));
  const suggestionsStop = selectedRegion ? regionStopsMap[selectedRegion].filter(({ city }) => city.toLowerCase().includes(queryStop.trim().toLowerCase())) : [];

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedRegion;
      case 1: return numberOfAdults + numberOfChildren > 0;
      case 2: return !!endDate;
      case 3: return maxPrice > 0;
      case 4: return stops.length > 0;
      case 5: return selectedModes.length > 0;
      default: return true;
    }
  };

  const onNext = () => {
    if (step < labels.length - 1) {
      setStep(s => s + 1);
    } else {
      router.push({
        pathname: '/result',
        params: {
          origin: startCity!,
          stops: stops.map(s => s.city),
          destination: startCity!,
          modes: selectedModes,
          originAirport,
          destinationAirport,
          stopsAirport: stops.map(s => s.airport)
        }
      });
    }
  };
  const onBack = () => step > 0 && setStep(s => s - 1);

  if (locationLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size='large' /><Text style={styles.loadingText}>Standort wird ermittelt...</Text></View>;
  }

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <TextInput style={[styles.inputTextContainer, styles.inputText]} placeholder='Choose a region...' value={queryRegion} onChangeText={t => { setQueryRegion(t); setSelectedRegion(null); setShowDropdown(true); }} />
            {queryRegion.length > 0 && showDropdown && (
              <View style={styles.dropdown}>
                {suggestionsRegion.map(item => <TouchableOpacity key={item} onPress={() => { setQueryRegion(item); setSelectedRegion(item); setShowDropdown(false); }}><Text style={styles.item}>{item}</Text></TouchableOpacity>)}
              </View>
            )}
          </>
        );
      case 1:
        return <NumberOfPeople numberOfAdults={numberOfAdults} onChangeNumberOfAdults={setNumberOfAdults} numberOfChildren={numberOfChildren} onChangeNumberOfChildren={setNumberOfChildren} />;
      case 2:
        return <InputDatePicker startDate={startDate} endDate={endDate} showStartPicker={showStartPicker} showEndPicker={showEndPicker} onStartPress={() => setShowStartPicker(true)} onEndPress={() => setShowEndPicker(true)} onChangeStart={onChangeStart} onChangeEnd={onChangeEnd} />;
      case 3:
        return <MaximalPrice maxPrice={maxPrice} onChange={setMaxPrice} />;
      case 4:
        return (
          <View>
            <Text style={styles.label}>Stops in {selectedRegion}</Text>
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
        );
      case 5:
        return (
          <View style={styles.modesContainer}>
            {MODES.map(m => <TouchableOpacity key={m.key} style={[styles.modeItem, selectedModes.includes(m.key) && styles.modeSelected]} onPress={() => toggleMode(m.key)}><Text style={[styles.modeText, selectedModes.includes(m.key) && styles.modeTextSelected]}>{m.label}</Text></TouchableOpacity>)}
          </View>
        );
      case 6:
        return (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text>Region: {selectedRegion}</Text>
            <Text>Dates: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</Text>
            <Text>Adults: {numberOfAdults}, Children: {numberOfChildren}</Text>
            <Text>Price ≤ {maxPrice}€</Text>
            <Text>Stops: {stops.map(s => s.city).join(', ')}</Text>
            <Text>Modes: {selectedModes.join(', ')}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundSwiper}>
        <Swiper autoplay loop showsPagination={false}><>
          {bgImages.map((img, idx) => <View key={idx} style={styles.slide}><Image source={img} style={styles.backgroundImage} resizeMode='cover'/><View style={styles.descriptionOverlay}><Text style={styles.descriptionTitle}>{bgImagesDescription[idx].title}</Text><Text style={styles.descriptionText}>{bgImagesDescription[idx].text}</Text></View></View>)}
        </></Swiper>
      </View>
      <KeyboardAwareScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled' enableOnAndroid extraScrollHeight={Platform.OS==='ios'?20:60}>
        <StepIndicator customStyles={stepIndicatorStyles} currentPosition={step} labels={labels} stepCount={labels.length} />
        <View style={styles.stepsContainer}>{renderContent()}</View>
        <View style={styles.navContainer}>
          {step>0 && <Pressable style={styles.navButton} onPress={onBack}><Text style={styles.buttonText}>Back</Text></Pressable>}
          <Pressable style={[styles.navButton, !canNext()&&styles.buttonDisabled]} onPress={onNext} disabled={!canNext()}><Text style={styles.buttonText}>{step===labels.length-1?'Show Route': step===0?'Start':'Next'}</Text></Pressable>
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
