// components/Search/CityPicker.tsx
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { City } from '@/interfaces/destinations';

interface CityPickerProps {
  filteredCities: City[];       // Alle potenziellen Städte (bereits nach Region gefiltert)
  stops: City[];                // Schon ausgewählte Stops
  onSelect: (city: City) => void; // Callback, wenn eine Stadt ausgewählt wird
}

export default function CityPicker({ filteredCities, stops, onSelect }: CityPickerProps) {
  const [showModal, setShowModal] = useState(false);

  // Verfügbare Städte (filteredCities minus bereits in stops)
  const availableCities = filteredCities.filter(
    (c) => !stops.some((s) => s.id === c.id)
  );

  // Label, das der Pressable-Button anzeigt
  const getLabel = () => {
    return stops.length === 0 ? 'Select a Stop' : 'Add another Stop';
  };

  return (
    <>


      {Platform.OS === 'ios' ? (
        /* === iOS-Variante: Modal mit Picker === */
       <>
          {/* === Pressable Button: öffnet das Modal === */}
          <Pressable
            onPress={() => setShowModal(true)}
            style={styles.pressable}
          >
            <Text style={styles.pressableText}>{getLabel()}</Text>
          </Pressable>
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Stop</Text>

              <View style={styles.pickerContainer}>
                <Picker
                  // Wir geben hier keinen „selectedValue“ vor, da wir immer neu auswählen
                  selectedValue={null}
                  onValueChange={(cityId) => {
                    if (cityId === null) {
                      // Cancel ausgewählt: Modal einfach schließen
                      setShowModal(false);
                    } else {
                      // Echte Stadt ausgewählt: Callback und Modal schließen
                      const cityObj = availableCities.find(
                        (c) => c.id === cityId
                      );
                      if (cityObj) {
                        onSelect(cityObj);
                      }
                      setShowModal(false);
                    }
                  }}
                >
                  {/* Erster Eintrag: Cancel */}
                  {availableCities.map((c) => (
                    <Picker.Item
                      key={c.id}
                      label={`${c.city_name}, ${c.country}`}
                      value={c.id}
                    />
                  ))}
                  <Picker.Item label="Choose City" value={null} />
                </Picker>
              </View>
            </View>
          </View>
        </Modal>
        </>
      ) : (
        /* === Android-Fallback: Inline Picker === */
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={null}
            onValueChange={(cityId) => {
              if (cityId !== null) {
                const cityObj = availableCities.find((c) => c.id === cityId);
                if (cityObj) {
                  onSelect(cityObj);
                }
              }
              // Wenn cityId === null (Cancel), ignoriere
            }}
          >
            {availableCities.map((c) => (
              <Picker.Item
                key={c.id}
                label={`${c.city_name}, ${c.country}`}
                value={c.id}
              />
            ))}
            <Picker.Item label="Choose City" value={null} />
          </Picker>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  pressableText: {
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerContainer: {
      flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    overflow: 'hidden',
  },
});
