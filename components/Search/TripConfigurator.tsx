import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import StepIndicator from 'react-native-step-indicator';
import Swiper from 'react-native-swiper';

// API Client
import { City, Region } from '@/interfaces/destinations';
import api from '../../services/api';

// Components
import { Picker } from '@react-native-picker/picker';
import InputDatePicker from './InputDatePicker';
import MaximalPrice from './MaximalPrice';
import NumberOfPeople from './NumberOfPeople';
import Summary from './Summary';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Assets
const bgImages = [
  require('../../assets/images/beach.png'),
  require('../../assets/images/countryside.png'),
  require('../../assets/images/greek-coast-sunshine.png'),
  require('../../assets/images/mountain.jpg'),
];
const bgImagesDescription = [
  { title: 'Cliffs of Dover', text: "Marvel the beauty..." },
  { title: 'Swiss Alps', text: 'Chocolate, Cheese and endless Charm...' },
  { title: 'Aegean Islands', text: 'Since Antiquity...' },
  { title: 'Valleys of California', text: '' },
];

const MODES = [
  { key: 'bus', label: 'Bus' },
  { key: 'train', label: 'Train' },
  { key: 'flight', label: 'Airplane' },
];


// Step Indicator labels & styles
const labels = [
  'Region',
  'People',
  'Dates',
  'Price',
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

export default function TripConfigurator() {
  const router = useRouter();

  // Stepper state
  const [step, setStep] = useState(0);

  // Loading & origin
  const [locationLoading, setLocationLoading] = useState(false);
  const [startCity, setStartCity] = useState<string | null>(null);
  const [originAirport, setOriginAirport] = useState<string | null>(null);

  // Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [queryStop, setQueryStop] = useState('');
  const [selectedStop, setSelectedStop] = useState<City | null>(null);
  const [stops, setStops] = useState<City[]>([]);

  // Steps 2-5
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);


  const fetchRegions = async () => {
    const regions = await api.destinations.getAllRegions();
    setRegions(regions);
  };

  const fetchAllCities = async () => {
    const cities = await api.destinations.getAllCities();
    setAllCities(cities);
    setFilteredCities(cities);
  };

  // Update filtered cities when region or search query changes
  useEffect(() => {
    let filtered = allCities;

    // Filter by region if one is selected
    if (selectedRegionId) {
      filtered = filtered.filter(city => city.region_id === selectedRegionId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(city =>
        city.city_name.toLowerCase().includes(query) || city.country.toLowerCase().includes(query)
      );
    }

    setFilteredCities(filtered);
  }, [selectedRegionId, searchQuery, allCities]);

  // Hilfsfunktion Airport finden (Interface: City.IATA)
  const findAirport = (cityName: string) => {
    const found = allCities.find(c => c.city_name === cityName);
    return found?.IATA || 'VIE';
  };

  useEffect(() => {
    fetchRegions();
    fetchAllCities();
  }, []);

  // Datum-Picker Handlers
  const onChangeStart = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setStartDate(selectedDate);
      // If end date is before new start date, update it
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
    setShowStartPicker(false);
  };

  const onChangeEnd = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
    setShowEndPicker(false);
  };

  // Transport-Modi umschalten
  const toggleMode = (modeKey: string) => {
    setSelectedModes(prev =>
      prev.includes(modeKey)
        ? prev.filter(m => m !== modeKey)   // entfernen, wenn schon drin
        : [...prev, modeKey]                // hinzufügen, wenn nicht drin
    );
  };


  // Navigation logic
  const canNext = () => {
    switch (step) {
      case 0: return !!selectedCity;
      case 1: return numberOfAdults + numberOfChildren > 0;
      case 2: return !!startDate && !!endDate;
      case 3: return maxPrice > 0;
      case 4: return selectedModes.length > 0;
      default: return true;
    }
  };

  const onNext = () => {
    if (step < labels.length - 1) setStep(step + 1);
    else {
      router.push({
        pathname: '/result',
        params: {
          regionId: selectedRegionId,
          regionName: selectedCity?.city_name,
          origin: startCity,
          originAirport,
          stops: stops.map(s => s.city_name),
          stopsAirport: stops.map(s => s.IATA),
          modes: selectedModes,
          dates: { start: startDate, end: endDate },
          price: maxPrice,
          people: { adults: numberOfAdults, children: numberOfChildren }
        }
      });
    }
  };

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text className="text-2xl font-bold text-center mb-2">Destination</Text>
            <Text className="text-sm text-gray-500">Select a region</Text>
            <View className="border border-gray-200 rounded-md">
              <Picker
                selectedValue={selectedRegionId}
                onValueChange={(value) => {
                  setSelectedRegionId(value);
                  setSelectedCity(null);
                  setShowDropdown(false);
                  setSearchQuery('');
                }}
              >
                <Picker.Item key="all" label="All Regions" value={null} />
                {regions.map(r => (
                  <Picker.Item key={r.id} label={r.name} value={r.id} />
                ))}
              </Picker>
            </View >
            <Text className="text-md text-gray-500 mt-4">Select a city</Text>
            <TextInput
              className="border border-gray-200 rounded-md p-4"
              placeholder="Choose a city..."
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
                setSelectedCity(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {
              showDropdown && (
                <View className="absolute top-full left-0 right-0 z-[1000] bg-white border border-gray-200 rounded shadow-lg">
                  <ScrollView style={{ maxHeight: 240 }}>
                    {filteredCities.map(city => (
                      <TouchableOpacity
                        key={city.id}
                        onPress={() => {
                          setSearchQuery(`${city.city_name}, ${city.country}`);
                          setSelectedCity(city);
                          setSelectedRegionId(city.region_id);
                          setShowDropdown(false);
                        }}
                        className="border-b border-gray-200 p-4"
                      >
                        <Text className="text-lg text-gray-500">{city.city_name}, {city.country}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )
            }
          </>
        );
      case 1:
        return (
          <View className="items-center p-4">
            <Text className="text-2xl font-bold mb-2">Passengers</Text>
            <NumberOfPeople numberOfAdults={numberOfAdults} onChangeNumberOfAdults={setNumberOfAdults} numberOfChildren={numberOfChildren} onChangeNumberOfChildren={setNumberOfChildren} />
          </View>
        );
      case 2:
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold mt-4">Dates</Text>
            <InputDatePicker
              startDate={startDate}
              endDate={endDate}
              showStartPicker={showStartPicker}
              showEndPicker={showEndPicker}
              onStartPress={() => setShowStartPicker(true)}
              onEndPress={() => setShowEndPicker(true)}
              onChangeStart={onChangeStart}
              onChangeEnd={onChangeEnd}
            />
          </View>
        );
      case 3:
        return <MaximalPrice maxPrice={maxPrice} onChange={setMaxPrice} />;
      case 4:
        return (
          <View className="items-center p-4">
            <Text className="text-2xl font-bold mb-2">Transport Modes</Text>
            <Text className="text-sm text-gray-500">Select the modes of transport you want to use</Text>
            <View className="flex-row flex-wrap mt-4 justify-between items-center">
              {MODES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  className="px-4 py-2 bg-white border-2 border-black rounded-full mr-2"
                  style={{ backgroundColor: selectedModes.includes(m.key) ? 'black' : 'white' }}
                  onPress={() => toggleMode(m.key)}>
                  <View className="flex-row items-center">
                    <FontAwesome
                      name={m.key === 'bus' ? 'bus' : m.key === 'train' ? 'train' : 'plane'}
                      size={24}
                      color={selectedModes.includes(m.key) ? 'white' : 'black'}
                    />
                    <Text
                      className="text-lg font-bold ml-2"
                      style={{ color: selectedModes.includes(m.key) ? 'white' : 'black' }}
                    >
                      {m.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <Summary
            people={numberOfAdults + numberOfChildren}
            region={selectedCity?.city_name ?? ''}
            stops={[]}
            price={maxPrice}
            modes={selectedModes}
            startDate={startDate}
            endDate={endDate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundSwiper}>
        <Swiper autoplay loop showsPagination={false}>
          {bgImages.map((img, idx) => (
            <View key={idx} style={styles.slide}>
              <Image source={img} style={styles.backgroundImage} resizeMode="cover" />
              <View style={styles.descriptionOverlay}>
                <Text style={styles.descriptionTitle}>{bgImagesDescription[idx].title}</Text>
                <Text style={styles.descriptionText}>{bgImagesDescription[idx].text}</Text>
              </View>
            </View>
          ))}
        </Swiper>
      </View>
      <KeyboardAwareScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}>
        <StepIndicator customStyles={stepIndicatorStyles} currentPosition={step} labels={labels} stepCount={labels.length} />
        <View style={styles.stepsContainer}>{renderContent()}</View>
        <View style={styles.navContainer}>
          {step > 0 && <Pressable style={styles.navButton} onPress={() => setStep(step - 1)}><Text style={styles.buttonText}>Back</Text></Pressable>}
          <Pressable style={[styles.navButton, !canNext() && styles.buttonDisabled]} onPress={onNext} disabled={!canNext()}><Text style={styles.buttonText}>{step === labels.length - 1 ? 'Show Route' : step === 0 ? 'Start' : 'Next'}</Text></Pressable>
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
    zIndex: -1
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
    margin: 4,
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
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
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
  padding: { paddingVertical: 10 },
  scrollArea: {
    flex: 1,
    backgroundColor: 'transparent',  // damit der Swiper durchscheint
  },
  labelStepTitle: {
    padding: 10,
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
