// components/Search/TripConfigurator.tsx

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
  View,
  Modal,
} from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { City, Region } from '@/interfaces/destinations';
import api from '@/services/api';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import InputDatePicker from './InputDatePicker';
import MaximalPrice from './MaximalPrice';
import NumberOfPeople from './NumberOfPeople';
import Summary from './Summary';
import KeyboardWrapper from '@/components/Search/KeyBoardWrapper';
import RegionPicker from '@/components/Search/RegionPicker';
import CityPicker from '@/components/Search/CityPicker';

const MODES = [
  { key: 'bus', label: 'Bus' },
  { key: 'train', label: 'Train' },
  { key: 'flight', label: 'Airplane' },
];
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

interface TripConfiguratorProps {
  selectedRegionId: string | null;
  onRegionChange: (value: string | null) => void;
  onShowResult?: (params: Record<string, string>) => void;
}


export default function TripConfigurator({
  selectedRegionId,
  onRegionChange,
  onShowResult,
}: TripConfiguratorProps) {
  const router = useRouter();

  // Step-State
  const [step, setStep] = useState<number>(0);
  // Daten-States
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const [startCity, setStartCity] = useState<string>('Vienna');
  const [originAirport, setOriginAirport] = useState<string>('VIE');

  const [queryStop, setQueryStop] = useState<string>('');
  const [selectedStop, setSelectedStop] = useState<City | null>(null);
  const [stops, setStops] = useState<City[]>([]);
  const [showCityModal, setShowCityModal] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [numberOfAdults, setNumberOfAdults] = useState<number>(1);
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const fetchRegions = async () => {
    const regs = await api.destinations.getAllRegions();
    setRegions(regs);
  };

  const fetchAllCities = async () => {
    const cities = await api.destinations.getAllCities();
    setAllCities(cities);
    setFilteredCities(cities);
  };

  const findAirport = (cityName: string): string => {
    const found = allCities.find(c => c.city_name === cityName);
    return found?.IATA || 'VIE';
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required.');
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

  useEffect(() => {
    let filtered = allCities;
    if (selectedRegionId) {
      filtered = filtered.filter(c => c.region_id === selectedRegionId);
    }
    if (queryStop) {
      const q = queryStop.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.city_name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q),
      );
    }
    setFilteredCities(filtered);
  }, [selectedRegionId, queryStop, allCities]);

  useEffect(() => {
    fetchRegions();
    fetchAllCities();
  }, []);

  const addStop = () => {
    if (
      selectedStop &&
      !stops.some(s => s.id === selectedStop.id) &&
      stops.length < 5
    ) {
      setStops(prev => [...prev, selectedStop]);
      setQueryStop('');
      setSelectedStop(null);
    }
  };

  const removeStop = (id: string) =>
    setStops(prev => prev.filter(s => s.id !== id));

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

  const toggleMode = (modeKey: string) =>
    setSelectedModes(prev =>
      prev.includes(modeKey) ? prev.filter(x => x !== modeKey) : [...prev, modeKey],
    );

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!selectedRegionId && stops.length > 0;
      case 1:
        return numberOfAdults + numberOfChildren > 0;
      case 2:
        return !!startDate && !!endDate;
      case 3:
        return maxPrice > 0;
      case 4:
        return selectedModes.length > 0;
      default:
        return true;
    }
  };

  const onNext = () => {
    if (step < labels.length - 1) return setStep(step + 1);

    // Letzter Step: wir bauen pushParams
    const pushParams: Record<string, string> = {
      id: '', // leer, weil noch nicht gespeichert
      regionId: selectedRegionId!.toString(),
      origin: startCity,
      destination: startCity,
      originAirport,
      stops: stops.map(s => s.city_name).join(','),
      stopsAirport: stops.map(s => s.IATA).join(','),
      modes: selectedModes.join(','),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price: maxPrice.toString(),
      numberOfAdults: numberOfAdults.toString(),
      numberOfChildren: numberOfChildren.toString(),
    };

    console.log('[TripConfigurator] Öffne Modal mit params:', pushParams);
    if (onShowResult) {
      onShowResult(pushParams);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text className="text-lg font-bold text-gray-500 text-center mb-2">
              Select a region
            </Text>
            <View className="border border-black-200 rounded-md">
              <RegionPicker
                selectedRegionId={selectedRegionId}
                onChange={value => {
                  onRegionChange(value);
                  setStops([]);       // Wenn Region wechselt, vorherige Stops löschen
                  setQueryStop('');
                  setShowDropdown(false);
                }}
                regions={regions}
              />
            </View>

            {selectedRegionId && (
              <>
                <Text className="text-lg font-bold text-gray-500 text-center mt-10">
                    Select stops
                </Text>

                {/* 1) Zeige alle bereits gewählten Stops als Chips */}
                <View style={styles.stopsContainer}>
                  {stops.map((s) => (
                    <View key={s.id} style={styles.stopItem}>
                      <Text style={styles.stopText}>{s.city_name}</Text>
                      <TouchableOpacity onPress={() => {
                        setStops((prev) => prev.filter((x) => x.id !== s.id));
                      }}>
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* 2) CityPicker‐Komponente */}
                <View style={[styles.row, styles.pickerWrapper]}>
                  <CityPicker
                    filteredCities={filteredCities}
                    stops={stops}
                    onSelect={(city) => {
                      setStops((prev) => [...prev, city]);
                    }}
                  />
                </View>
              </>
            )}
          </>
        );
      case 1:
        return (
          <View className="items-center">
            <Text className="text-2xl font-bold mb-2">Travelers</Text>
            <NumberOfPeople
              numberOfAdults={numberOfAdults}
              onChangeNumberOfAdults={setNumberOfAdults}
              numberOfChildren={numberOfChildren}
              onChangeNumberOfChildren={setNumberOfChildren}
            />
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
            <Text className="text-lg font-bold text-gray-500 text-center mb-2">
              Select the modes of transport you want to use:
            </Text>
            <View className="flex-row flex-wrap mt-4 justify-center items-center gap-2 w-full">
              {MODES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  className={`px-4 py-2 bg-white border-2 border-black rounded-full ${
                    selectedModes.includes(m.key) ? 'bg-black' : 'bg-white'
                  }`}
                  onPress={() => toggleMode(m.key)}
                >
                  <View className="flex-row items-center gap-2">
                    <FontAwesome
                      name={
                        m.key === 'bus'
                          ? 'bus'
                          : m.key === 'train'
                          ? 'train'
                          : 'plane'
                      }
                      size={20}
                      color={selectedModes.includes(m.key) ? 'black' : 'grey'}
                    />
                    <Text
                      className="text-base font-bold"
                      style={{
                        color: selectedModes.includes(m.key) ? 'black' : 'grey',
                      }}
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
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardWrapper>
        <StepIndicator
          customStyles={stepIndicatorStyles}
          currentPosition={step}
          labels={labels}
          stepCount={labels.length}
        />
        <View style={styles.stepsContainer}>{renderContent()}</View>

        <View style={styles.row}>
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
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navButton: {
    backgroundColor: '#aaa',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  buttonDisabled: { backgroundColor: '#ccc', borderColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputTextContainer: {
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  inputText: {
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    fontFamily: 'Roboto-Regular',
    color: '#000',
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 60,
  },
  addButton: {
    margin: 4,
    width: '20%',
    backgroundColor: '#aaa',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    margin: 4,
  },
  stopText: {
    marginRight: 6,
    color: '#000',
  },
  removeText: {
    color: '#000',
    fontWeight: '600',
  },
});
