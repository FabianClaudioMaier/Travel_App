import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import StepIndicator from 'react-native-step-indicator';

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
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          cities: [selectedCity?.city_name ?? ''],
          citiesAirport: [selectedCity?.IATA ?? ''],
          modes: selectedModes,
          dates: [startDate.toISOString(), endDate.toISOString()],
          price: maxPrice,
          people: [numberOfAdults, numberOfChildren]
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
            <Text className="text-base text-gray-500">Select a region</Text>
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
            <Text className="text-base text-gray-500 mt-4">Select a city</Text>
            <TextInput
              className="text-base border border-gray-200 rounded-md p-4"
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
                        <Text className="text-base text-gray-500">{city.city_name}, {city.country}</Text>
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
                      color={selectedModes.includes(m.key) ? 'white' : 'black'}
                    />
                    <Text
                      className="text-base font-bold"
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
            numberOfAdults={numberOfAdults}
            numberOfChildren={numberOfChildren}
            cities={[selectedCity?.city_name ?? '']}
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
    <View className="bg-white p-4 rounded-lg w-full h-[60%]">
      <StepIndicator customStyles={stepIndicatorStyles} currentPosition={step} labels={labels} stepCount={labels.length} />

      <View style={styles.stepsContainer}>{renderContent()}</View>

      <View className="flex-row justify-between mt-auto">
        {step > 0 &&
          <Pressable style={styles.navButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>}
        <Pressable style={[styles.navButton, !canNext() && styles.buttonDisabled]} onPress={onNext} disabled={!canNext()}>
          <Text style={styles.buttonText}>{step === labels.length - 1 ? 'Show Route' : step === 0 ? 'Start' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({


  navButton: { backgroundColor: '#aaa', padding: 14, borderRadius: 6, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  buttonDisabled: { backgroundColor: '#ccc', borderColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    borderRadius: 10,
    paddingVertical: 8,
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
