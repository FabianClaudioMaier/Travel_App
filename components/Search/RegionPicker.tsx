// components/Search/RegionPicker.tsx
import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function RegionPicker({
  selectedRegionId,
  onChange,
  regions,
}: {
  selectedRegionId: string | null;
  onChange: (value: string | null) => void;
  regions: { id: string; name: string }[];
}) {
  const [showModal, setShowModal] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <>
        {/* iOS: Pressable öffnet das Modal */}
        <Pressable
          onPress={() => setShowModal(true)}
          style={{
            borderColor: '#000',
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#fff',
          }}
        >
          <Text>
            {regions.find(r => r.id === selectedRegionId)?.name || 'Select Region'}
          </Text>
        </Pressable>

        <Modal visible={showModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', padding: 20 }}>
              <Picker
                selectedValue={selectedRegionId}
                onValueChange={(val) => {
                  if (val === null) {
                    // Cancel ausgewählt: Modal schließen, ohne onChange aufzurufen
                    setShowModal(false);
                  } else {
                    // Echte Region gewählt
                    onChange(val);
                    setShowModal(false);
                  }
                }}
              >
                {regions.map(r => (
                  <Picker.Item key={r.id} label={r.name} value={r.id} />
                ))}
                <Picker.Item label="Cancel" value={null} />
              </Picker>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Android‐Fallback: ebenfalls Picker mit „Cancel“-Eintrag, ohne eigenes Modal
  return (
    <View style={{ borderWidth: 1, borderColor: '#000', borderRadius: 4 }}>
      <Picker
        selectedValue={selectedRegionId}
        onValueChange={(val) => {
          if (val === null) {
            // Nur echte Region auswählen, „Cancel“ wird ignoriert
            setShowModal(false);
          }
            onChange(val);
            setShowModal(false);
        }}
      >
        {/* Erster Eintrag: Cancel */}

        {regions.map(r => (
          <Picker.Item key={r.id} label={r.name} value={r.id} />
        ))}
        <Picker.Item label="Cancel" value={null} />
      </Picker>
    </View>
  );
}
