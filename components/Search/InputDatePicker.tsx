import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

/**
 * Props for the InputDatePicker component.
 */
export interface InputDatePickerProps {
  /** The currently selected start date. */
  startDate: Date;
  /** The currently selected end date. */
  endDate: Date;
  /** Whether to display the start date picker. */
  showStartPicker: boolean;
  /** Whether to display the end date picker. */
  showEndPicker: boolean;
  /** Callback when the start date button is pressed. */
  onStartPress: () => void;
  /** Callback when the end date button is pressed. */
  onEndPress: () => void;
  /** Callback triggered when the start date changes. */
  onChangeStart: (event: DateTimePickerEvent, date?: Date) => void;
  /** Callback triggered when the end date changes. */
  onChangeEnd: (event: DateTimePickerEvent, date?: Date) => void;
}

/**
 * InputDatePicker component renders departure and return date selectors.
 * It shows native date pickers and disables the return date if the start date
 * is not set to a future date.
 */
export default function InputDatePicker({
  startDate,
  endDate,
  showStartPicker,
  showEndPicker,
  onStartPress,
  onEndPress,
  onChangeStart,
  onChangeEnd,
}: InputDatePickerProps) {
  // State to determine if the end date selector should be disabled
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true);

  /**
   * useEffect hook to enable/disable the return date picker based on start date.
   * Disables return if start date is today or earlier.
   */
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Enable return date only if start date is after today
    setIsEndDateDisabled(startDate.getTime() <= today.getTime());
  }, [startDate]);

  return (
    <View style={styles.container}>
      {/* Header with title */}
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={2}>
          Select the departure and return dates of your journey:
        </Text>
      </View>

      {/* Departure and return selectors */}
      <View style={styles.row}>
        {/* Departure Date */}
        <View style={styles.column}>
          <Text style={styles.label}>Departure</Text>
          <Pressable
            style={styles.pressable}
            onPress={onStartPress}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Return Date */}
        <View style={styles.column}>
          <Text style={styles.label}>Return</Text>
          <Pressable
            style={[
              styles.pressable,
              isEndDateDisabled && styles.disabled
            ]}
            onPress={onEndPress}
            disabled={isEndDateDisabled}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>
                {endDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Native date pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onChangeStart}
          minimumDate={new Date()}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onChangeEnd}
          minimumDate={startDate}
        />
      )}
    </View>
  );
}

// Stylesheet for InputDatePicker component
const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#444',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pressable: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dateBox: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
