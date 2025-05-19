import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Props for the Summary component.
 */
interface SummaryProps {
  /** Number of adult travelers */
  numberOfAdults: number;
  /** Number of child travelers (typically age 12 or younger) */
  numberOfChildren: number;
  /** Departure date of the journey */
  startDate: Date;
  /** Return date of the journey */
  endDate: Date;
  /** List of city names included in the route */
  cities: string[];
  /** Maximum budget for the journey in Euros */
  maxPrice: number;
  /** Preferred modes of transportation (e.g., plane, train) */
  modes: string[];
}

/**
 * Summary component displays a high-level overview of the travel plan.
 *
 * It includes:
 * - Route cities
 * - Traveler counts
 * - Journey dates
 * - Budget cap
 * - Transportation modes
 */
export default function Summary({
  numberOfAdults,
  numberOfChildren,
  startDate,
  endDate,
  cities,
  maxPrice,
  modes,
}: SummaryProps) {
  return (
    <View style={styles.container}>
      {/* Header title */}
      <Text style={styles.headerText}>Your Journey:</Text>

      {/* Route cities with marker icon */}
      <View style={styles.row}>
        <FontAwesome name="map-marker" size={20} />
        <Text style={styles.rowText}>{cities.join(', ')}</Text>
      </View>

      {/* Traveler counts with user icon */}
      <View style={styles.row}>
        <FontAwesome name="user" size={20} />
        <Text style={styles.rowText}>
          {numberOfAdults} Adults, {numberOfChildren} Children
        </Text>
      </View>

      {/* Dates with calendar icon */}
      <View style={styles.row}>
        <FontAwesome name="calendar" size={20} />
        <Text style={styles.rowText}>
          {startDate.toLocaleDateString('de-DE', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })} - {endDate.toLocaleDateString('de-DE', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Budget cap with money icon */}
      <View style={styles.row}>
        <FontAwesome name="money" size={20} />
        <Text style={styles.rowText}>Max. € {maxPrice.toLocaleString()}</Text>
      </View>

      {/* Transportation modes with plane icon */}
      <View style={styles.row}>
        <FontAwesome name="plane" size={20} />
        <Text style={styles.rowText}>{modes.join(', ')}</Text>
      </View>
    </View>
  );
}

// Stylesheet for Summary component
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '500',
  },
});
