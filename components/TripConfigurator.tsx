import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Platform, ScrollView } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import StepIndicator from 'react-native-step-indicator';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Cities } from '@/interfaces/destinations';
import api from '@/services/api';

type City = Cities[number];

interface Travelers {
  adults: number;
  children: number;
}

const labels = ["Destination", "Dates", "Passengers", "Summary"];

const customStyles = {
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
  stepIndicatorLabelFontSize: 12,
  currentStepIndicatorLabelFontSize: 14,
  stepIndicatorLabelCurrentColor: '#007AFF',
  stepIndicatorLabelFinishedColor: '#ffffff',
  stepIndicatorLabelUnFinishedColor: '#aaaaaa',
  labelColor: '#999999',
  labelSize: 12,
  currentStepLabelColor: '#007AFF'
};

const TripConfigurator = () => {
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<Cities>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [travelers, setTravelers] = useState<Travelers>({ adults: 0, children: 0 });
  const [showDatePicker, setShowDatePicker] = useState<{
    field: 'departure' | 'return' | null;
    visible: boolean;
  }>({ field: null, visible: false });

  const fetchCities = useCallback(async () => {
    setLoadingCities(true);
    try {
      const cities = await api.destinations.getAllCities();
      setCities(cities);
    } catch (error) {
      console.error("Error fetching cities", error);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleTravelerChange = useCallback((type: keyof Travelers, increment: boolean) => {
    setTravelers(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  }, []);

  const canGoNext = useCallback(() => {
    switch (step) {
      case 1:
        return selectedCity;
      case 2:
        return departureDate && returnDate && departureDate < returnDate;
      case 3:
        return travelers.adults > 0;
      default:
        return true;
    }
  }, [step, selectedCity, departureDate, returnDate, travelers]);

  const goNext = useCallback(() => {
    if (canGoNext() && step < labels.length) {
      setStep(prev => prev + 1);
    }
  }, [canGoNext, step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  const handleDateChange = useCallback((event: any, selectedDate: Date | undefined) => {
    setShowDatePicker({ field: null, visible: false });

    if (event.type === 'set' && selectedDate) {
      if (showDatePicker.field === 'departure') {
        setDepartureDate(selectedDate);
      } else if (showDatePicker.field === 'return') {
        setReturnDate(selectedDate);
      }
    }
  }, [showDatePicker.field]);

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getFullYear()}`;
  };

  if (showDatePicker.visible) {
    return (
      <DateTimePicker
        value={new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={handleDateChange}
      />
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>Select a origin and destination</Text>
            <Text style={styles.label}>From:</Text>
            <Dropdown
              data={cities}
              labelField="city_name"
              valueField="id"
              placeholder="Vienna"
              value="Vienna"
              onChange={(item: City) => setSelectedCity(item)}
              style={[styles.dropdown, { backgroundColor: '#f0f0f0', opacity: 0.7 }]}
              disable={true}
            />
            <Text style={styles.label}>To:</Text>
            {loadingCities ? (
              <ActivityIndicator size="small" />
            ) : (
              <Dropdown
                data={cities}
                labelField="city_name"
                valueField="id"
                placeholder="Select destination"
                value={selectedCity?.id}
                onChange={(item: City) => setSelectedCity(item)}
                style={styles.dropdown}
              />
            )}
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.label}>Departure Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ field: 'departure', visible: true })}
            >
              <Text>{departureDate ? formatDate(departureDate) : 'Select a date'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Return Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ field: 'return', visible: true })}
            >
              <Text>{returnDate ? formatDate(returnDate) : 'Select a date'}</Text>
            </TouchableOpacity>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.label}>Number of Travelers</Text>

            <View style={styles.counterContainer}>
              <Text style={styles.counterLabel}>Adults</Text>
              <View style={styles.counterControls}>
                <TouchableOpacity style={styles.counterButton} onPress={() => handleTravelerChange('adults', false)}>
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{travelers.adults}</Text>
                <TouchableOpacity style={styles.counterButton} onPress={() => handleTravelerChange('adults', true)}>
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.counterContainer}>
              <Text style={styles.counterLabel}>Children</Text>
              <View style={styles.counterControls}>
                <TouchableOpacity style={styles.counterButton} onPress={() => handleTravelerChange('children', false)}>
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{travelers.children}</Text>
                <TouchableOpacity style={styles.counterButton} onPress={() => handleTravelerChange('children', true)}>
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        );
      case 4:
        return (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
            <Text style={styles.summaryText}>To: {selectedCity?.city_name}</Text>
            <Text style={styles.summaryText}>Dates: {formatDate(departureDate!)} - {formatDate(returnDate!)}</Text>
            <Text style={styles.summaryText}>Adults: {travelers.adults}</Text>
            <Text style={styles.summaryText}>Children: {travelers.children}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <StepIndicator
          customStyles={customStyles}
          currentPosition={step - 1}
          labels={labels}
          stepCount={labels.length}
        />

        <View style={styles.content}>
          {renderStepContent()}
        </View>

        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.button} onPress={goBack}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < labels.length && (
            <TouchableOpacity
              style={[styles.button, !canGoNext() && styles.disabledButton]}
              onPress={goNext}
              disabled={!canGoNext()}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default TripConfigurator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    minHeight: 420, // consistent height for all steps
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    marginTop: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },

  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },

  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },

  counterContainer: {
    marginBottom: 20,
  },

  counterLabel: {
    fontSize: 16,
    marginBottom: 8,
  },

  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },

  counterButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },

  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  summaryText: {
    fontSize: 16,
    marginBottom: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#ccc',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
