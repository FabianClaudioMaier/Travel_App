// components/MaximalPrice.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from 'react-native';
import IconPlusImg from '../assets/images/plus.png';
import IconMinusImg from '../assets/images/minus.png';

export interface MaximalPriceProps {
  /** Aktueller maximaler Preis (in Euro) */
  maxPrice: number;
  /**
   * Wird aufgerufen, wenn sich der Preis ändern soll.
   * @param newPrice der neue Preis (in Euro)
   */
  onChange: (newPrice: number) => void;
}

const PRICE_OPTIONS = [500, 1000, 2000, 3000, 5000, 10000,];

export default function MaximalPrice({ maxPrice, onChange }:MaximalPriceProps ) {
  return (
    <View style={styles.container}>
      {/* Erläuterungstexte */}
      <Text style={styles.note}>
        The total price of the journey should not exceed this price*
      </Text>

      {/* manueller Wert */}
      <View style={styles.manualContainer}>
        <TouchableOpacity
          style={[styles.adjustButton, styles.plus]}
          onPress={() => onChange(maxPrice + 500)}
        >
          <Image source={IconPlusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
        <Text style={styles.valueText}>{maxPrice}</Text>
        <Text style={styles.currency}>€</Text>
        <TouchableOpacity
          style={[styles.adjustButton]}
          onPress={() => onChange(Math.max(0, maxPrice - 500))}
        >
          <Image source={IconMinusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
      </View>



      {/* Preset-Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipGroups}
      >
        {PRICE_OPTIONS.map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.chip,
              maxPrice === p && styles.chipSelected
            ]}
            onPress={() => onChange(p)}
          >
            <Text style={[
              styles.chipText,
              maxPrice === p && styles.chipTextSelected
            ]}>
              {p.toLocaleString()} €
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subNote}>
        *If we are unable to find a fitting trip, we will show you the cheapest result.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
   borderRadius: 10,
   alignItems: 'center',
   backgroundColor: '#fff',
   opacity: 0.8
   },
  chipGroups: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'left',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  chipSelected: { backgroundColor: '#000' },
  chipText: { fontSize: 14, color: '#000' },
  chipTextSelected: { color: '#fff' },
  manualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 20,
  },
  valueText: {
    fontSize: 40,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  currency: { fontSize: 40, fontWeight: '700' },
  adjustButton: {
    width: 70,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: '#f0f0f0',
  },
  note: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 4,
    width: 300
  },
  subNote: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    width: 270,
  },
});