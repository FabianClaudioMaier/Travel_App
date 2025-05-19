import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import * as Location from 'expo-location';

// API Client
import { City, Region } from '@/interfaces/destinations';
import api from '@/services/api';

// Components
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import InputDatePicker from './InputDatePicker';
import MaximalPrice from './MaximalPrice';
import NumberOfPeople from './NumberOfPeople';
import Summary from './Summary';

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

  // Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const [startCity, setStartCity] = useState<string>('Vienna');
  const [originAirport, setOriginAirport] = useState<string>('VIE');

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

    // Hilfsfunktion Airport finden (Interface: City.IATA)
  const findAirport = (cityName: string) => {
    const found = allCities.find(c => c.city_name === cityName);
    return found?.IATA || 'VIE';
  };

// **Location-Hook**: jetzt mit Imports und funktionierend
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erlaubnis benötigt', 'Standortzugriff ist erforderlich.');
        setStartCity('Vienna');
        setOriginAirport(findAirport('Vienna'));
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const rev = await Location.reverseGeocodeAsync(loc.coords);
        const city = rev[0]?.city || 'Vienna';
        setStartCity(city);
        setOriginAirport(findAirport(city));
      } catch {
        setStartCity('Vienna');
        setOriginAirport(findAirport('Vienna'));
      }
    })();
  }, [allCities]);

  // update cities filter
  useEffect(() => {
    let filtered = allCities;
    if (selectedRegionId) filtered = filtered.filter(c => c.region_id === selectedRegionId);
    if (queryStop) {
      const q = queryStop.toLowerCase();
      filtered = filtered.filter(
        c => c.city_name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
      );
    }
    setFilteredCities(filtered);
  }, [selectedRegionId, queryStop, allCities]);

  // initial fetch
  useEffect(() => {
    fetchRegions();
    fetchAllCities();

  }, []);

  // Add / Remove Stops
  const addStop = () => {
    if (selectedStop && !stops.some(s => s.id === selectedStop.id) && stops.length < 5) {
      setStops(prev => [...prev, selectedStop]);
      setQueryStop('');
      setSelectedStop(null);
    }
  };
  const removeStop = (id: string) => setStops(prev => prev.filter(s => s.id !== id));

  // Date pickers…
  const onChangeStart = (_: any, date?: Date) => {
    if (date) {
      setStartDate(date);
      if (endDate < date) setEndDate(date);
    }
    setShowStartPicker(false);
  };
  const onChangeEnd = (_: any, date?: Date) => {
    if (date) setEndDate(date);
    setShowEndPicker(false);
  };

  const toggleMode = (m: string) =>
    setSelectedModes(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedRegionId && stops.length > 0;
      case 1: return numberOfAdults + numberOfChildren > 0;
      case 2: return !!startDate && !!endDate;
      case 3: return maxPrice > 0;
      case 4: return selectedModes.length > 0;
      default: return true;
    }
  };

  const onNext = () => {
    if (step < labels.length - 1) return setStep(step + 1);

    const pushParams = {
      id: null,
      regionId: selectedRegionId!,
      origin: startCity,
      destination: startCity,
      originAirport,
      stops: stops.map(s => s.city_name).join(','),
      stopsAirport: stops.map(s => s.IATA).join(','),
      modes: selectedModes.join(','),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price: maxPrice.toString(),
    };

    console.log('[TripConfigurator] Navigating to ResultScreen with params:', pushParams);
    router.push({ pathname: '/result', params: pushParams });
  };

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text className="text-base text-gray-500">Select a region</Text>
            <View className="border border-gray-200 rounded-md">
              <Picker
                selectedValue={selectedRegionId}
                onValueChange={(value) => {
                  setSelectedRegionId(value);
                  setStops([]);         // stops zurücksetzen
                  setQueryStop('');
                  setShowDropdown(false);
                }}
              >
                <Picker.Item key="all" label="All Regions" value={null} />
                {regions.map(r => (
                  <Picker.Item key={r.id} label={r.name} value={r.id} />
                ))}
              </Picker>
            </View>

            {selectedRegionId && (
              <>
                <Text className="mt-4 text-base text-gray-500">Select Stops</Text>

                {/* angezeigte Stops */}
                <View style={styles.stopsContainer}>
                  {stops.map(s => (
                    <View key={s.id} style={styles.stopItem}>
                      <Text style={styles.stopText}>{s.city_name}</Text>
                      <TouchableOpacity onPress={() => removeStop(s.id)}>
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Eingabe + Add-Button */}
                <View style={[styles.row, styles.inputTextContainer]}>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="Click here..."
                    value={queryStop}
                    onChangeText={text => {
                      setQueryStop(text);
                      setSelectedStop(null);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  <Pressable
                    style={[
                      styles.addButton,
                      (!selectedStop ||
                        stops.some(s => s.id === selectedStop.id)) &&
                        styles.buttonDisabled
                    ]}
                    onPress={addStop}
                    disabled={!selectedStop || stops.some(s => s.id === selectedStop.id)}
                  >
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                </View>

                {/* Dropdown mit Vorschlägen */}
                {showDropdown && filteredCities.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-50">
                    <ScrollView style={{ maxHeight: 150 }}>
                      {filteredCities.map(city => (
                        <TouchableOpacity
                          key={city.id}
                          onPress={() => {
                            setQueryStop(city.city_name);
                            setSelectedStop(city);
                            setShowDropdown(false);
                          }}
                          className="border-b border-gray-200 p-4"
                        >
                          <Text className="text-base text-gray-500">
                            {city.city_name}, {city.country}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </>
        );
      case 1:
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold mb-2">Passengers</Text>
            <NumberOfPeople numberOfAdults={numberOfAdults} onChangeNumberOfAdults={setNumberOfAdults} numberOfChildren={numberOfChildren} onChangeNumberOfChildren={setNumberOfChildren} />
          </View>
        );
      case 2:
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold">Dates</Text>
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
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold mb-2">Budget</Text>
            <MaximalPrice maxPrice={maxPrice} onChange={setMaxPrice} />
          </View>
        );
      case 4:
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold mb-2">Transport Modes</Text>
            <Text className="text-sm text-gray-500">Select the modes of transport you want to use</Text>
            <View className="flex-row flex-wrap mt-4 justify-center items-center gap-2 w-full">
              {MODES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  className={`px-4 py-2 bg-white border-2 border-black rounded-full ${selectedModes.includes(m.key) ? 'bg-black' : 'bg-white'}`}
                  onPress={() => toggleMode(m.key)}
                >
                  <View className="flex-row items-center gap-2">
                    <FontAwesome
                      name={m.key === 'bus' ? 'bus' : m.key === 'train' ? 'train' : 'plane'}
                      size={20}
                      color={selectedModes.includes(m.key) ? 'black' : 'grey'}
                    />
                    <Text
                      className="text-base font-bold"
                      style={{ color: selectedModes.includes(m.key) ? 'black' : 'grey' }}
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
            numberOfAdults={numberOfAdults}
            numberOfChildren={numberOfChildren}
            cities={stops.map(s => s.city_name)}
            maxPrice={maxPrice}
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
    <View className="bg-white p-4 rounded-lg w-full">
      <StepIndicator
        customStyles={stepIndicatorStyles}
        currentPosition={step}
        labels={labels}
        stepCount={labels.length}
      />
      <View style={styles.stepsContainer}>{renderContent()}</View>
      <View className="flex-row justify-between mt-auto">
        {step > 0 && (
          <Pressable
            style={styles.navButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.navButton, !canNext() && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!canNext()}
        >
          <Text style={styles.buttonText}>
            {step === labels.length - 1
              ? 'Show Route'
              : step === 0
              ? 'Start'
              : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navButton: {
    backgroundColor: '#aaa',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4
  },
  buttonDisabled: { backgroundColor: '#ccc', borderColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    borderRadius: 10,
    paddingVertical: 8,
    flex: 1
  },

  inputTextContainer: {
    borderRadius: 4,
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    width: "100%",
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 60,
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

});
