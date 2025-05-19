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
 * Props for the NumberOfPeople component.
 */
export interface NumberOfPeopleProps {
  /** Current number of adult travelers */
  numberOfAdults: number;
  /**
   * Callback when the number of adults should change.
   * @param newCount The new number of adults
   */
  onChangeNumberOfAdults: (newCount: number) => void;
  /** Current number of child travelers (12 years or younger) */
  numberOfChildren: number;
  /**
   * Callback when the number of children should change.
   * @param newCount The new number of children
   */
  onChangeNumberOfChildren: (newCount: number) => void;
}

/**
 * NumberOfPeople component provides UI controls to adjust the number of
 * adults and children in the travel party.
 *
 * Features:
 * - Displays section labels for adults and children.
 * - Provides decrement and increment buttons for each group.
 * - Ensures counts cannot go below zero.
 */
export default function NumberOfPeople({
  numberOfAdults,
  onChangeNumberOfAdults,
  numberOfChildren,
  onChangeNumberOfChildren
}: NumberOfPeopleProps) {
  return (
    <View style={styles.container}>
      {/* Section: Adults */}
      <Text style={styles.sectionLabel}>Adults</Text>
      <View style={styles.adjustRow}>
        {/* Decrement adults count, minimum 0 */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChangeNumberOfAdults(Math.max(0, numberOfAdults - 1))}
        >
          <FontAwesome name="minus" size={36} color="black" />
        </TouchableOpacity>
        {/* Display current adults count */}
        <Text style={styles.countText}>{numberOfAdults}</Text>
        {/* Increment adults count */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChangeNumberOfAdults(numberOfAdults + 1)}
        >
          <FontAwesome name="plus" size={36} color="black" />
        </TouchableOpacity>
      </View>

      {/* Section: Children */}
      <Text style={styles.sectionLabel}>Children</Text>
      <Text style={styles.subLabel}>12 years or younger</Text>
      <View style={styles.adjustRow}>
        {/* Decrement children count, minimum 0 */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChangeNumberOfChildren(Math.max(0, numberOfChildren - 1))}
        >
          <FontAwesome name="minus" size={36} color="black" />
        </TouchableOpacity>
        {/* Display current children count */}
        <Text style={styles.countText}>{numberOfChildren}</Text>
        {/* Increment children count */}
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => onChangeNumberOfChildren(numberOfChildren + 1)}
        >
          <FontAwesome name="plus" size={36} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for NumberOfPeople component
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  adjustRow: {
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
  countText: {
    fontSize: 48,
    fontWeight: '700',
    marginHorizontal: 8,
    color: '#000',
  },
});
