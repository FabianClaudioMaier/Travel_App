import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Props for the MaximalPrice component.
 */
export interface MaximalPriceProps {
  /** Current maximum price (in Euro) */
  maxPrice: number;
  /**
   * Callback invoked when the price should change.
   * @param newPrice The new price value (in Euro)
   */
  onChange: (newPrice: number) => void;
}

/**
 * Preset price options (in Euro) for quick selection.
 */
const PRICE_OPTIONS: number[] = [100, 500, 1000, 2000, 3500, 5000];

/**
 * MaximalPrice component renders UI controls to select a maximum price.
 *
 * Features:
 * - Explanation text describing the purpose of the control.
 * - Manual increment/decrement buttons to adjust price by €100.
 * - Preset chips for quick selection of common price ceilings.
 * - Note indicating fallback behavior if no trip matches the selected price.
 */
export default function MaximalPrice({ maxPrice, onChange }: MaximalPriceProps) {
  return (
    <View style={styles.container}>
      {/* Explanation text */}
      <Text style={styles.headerText} numberOfLines={2}>
        The total price of the journey should not exceed this price*
      </Text>

      {/* Manual value adjustment buttons */}
      <View style={styles.manualRow}>
        {/* Decrease price by €100, not going below 0 */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(Math.max(0, maxPrice - 100))}
        >
          <FontAwesome name="minus" size={36} color="black" />
        </TouchableOpacity>

        {/* Display current max price */}
        <Text style={styles.priceText}>{maxPrice}</Text>
        <Text style={styles.currencyText}>€</Text>

        {/* Increase price by €100 */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChange(maxPrice + 100)}
        >
          <FontAwesome name="plus" size={36} color="black" />
        </TouchableOpacity>
      </View>

      {/* Preset price option chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
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

      {/* Note about fallback behavior */}
      <Text style={styles.noteText} numberOfLines={2}>
        *If we are unable to find a fitting trip, we will show you the cheapest result.
      </Text>
    </View>
  );
}

/**
 * Styles for MaximalPrice component.
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adjustButton: {
    width: 70,
    height: 60,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  priceText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  currencyText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#000',
  },
  chipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  chipTextSelected: {
    color: '#fff',
  },
  noteText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
    width: 300,
  },
});
