import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Cities, Regions } from '@/interfaces/destinations';
import api from '@/services/api';

type Region = Regions[number];
type City = Cities[number];

const TripConfigurator = () => {
  const [step, setStep] = useState(1);

  const [regions, setRegions] = useState<Regions>([]);
  const [cities, setCities] = useState<Cities>([]);

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const fetchRegions = async () => {
    setLoadingRegions(true);
    try {
      const regions = await api.destinations.getAllRegions();
      setRegions(regions);
    } catch (error) {
      console.error("Error fetching regions", error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchCitiesByRegion = async (regionId: string) => {
    setLoadingCities(true);
    try {
      const cities = await api.destinations.getCitiesByRegion(regionId);
      setCities(cities);
    } catch (error) {
      console.error("Error fetching cities by region", error);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    if (step === 1) {
      fetchRegions();
    }
  }, [step]);

  useEffect(() => {
    if (selectedRegion?.id) {
      fetchCitiesByRegion(selectedRegion.id);
      setSelectedCity(null);
    }
  }, [selectedRegion]);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Trip Configurator</Text>

      <Text style={{ fontSize: 16, marginTop: 10 }}>Step {step} of 5</Text>

      {step === 1 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ marginBottom: 8 }}>Wähle eine Region:</Text>
          {loadingRegions ? (
            <ActivityIndicator size="small" />
          ) : (
            <Dropdown
              data={regions}
              labelField="name"
              valueField="id"
              placeholder="Region auswählen"
              value={selectedRegion?.id}
              onChange={(item: Region) => setSelectedRegion(item)}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                borderRadius: 6,
                marginBottom: 20
              }}
            />
          )}

          {selectedRegion && (
            <>
              <Text style={{ marginBottom: 8 }}>Wähle eine Stadt:</Text>
              {loadingCities ? (
                <ActivityIndicator size="small" />
              ) : (
                <Dropdown
                  data={cities}
                  labelField="city_name"
                  valueField="id"
                  placeholder="Stadt auswählen"
                  value={selectedCity?.id}
                  onChange={(item: City) => setSelectedCity(item)}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 10,
                    borderRadius: 6
                  }}
                />
              )}
            </>
          )}
        </View>
      )}

      {step === 2 && (
        <View>
          <Text>Step 2 – Coming soon...</Text>
        </View>
      )}
      {step === 3 && (
        <View>
          <Text>Step 3 – Coming soon...</Text>
        </View>
      )}
      {step === 4 && (
        <View>
          <Text>Step 4 – Coming soon...</Text>
        </View>
      )}
      {step === 5 && (
        <View>
          <Text>Step 5 – Coming soon...</Text>
        </View>
      )}
    </View>
  );
};

export default TripConfigurator;
