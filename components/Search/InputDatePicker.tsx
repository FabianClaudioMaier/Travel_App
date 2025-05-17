import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';

export interface InputDatePickerProps {
  /** Aktuelles Start-Datum */
  startDate: Date;
  /** Aktuelles End-Datum */
  endDate: Date;
  /** Picker für das Start-Datum anzeigen? */
  showStartPicker: boolean;
  /** Picker für das End-Datum anzeigen? */
  showEndPicker: boolean;
  /** Wird aufgerufen, wenn der Start-Date-Button gedrückt wird */
  onStartPress: () => void;
  /** Wird aufgerufen, wenn der End-Date-Button gedrückt wird */
  onEndPress: () => void;
  /**
   * Callback, wenn im DateTimePicker ein neues Start-Datum gewählt wird.
   * @param event das Picker-Event
   * @param date das gewählte Datum (oder undefined beim Abbrechen)
   */
  onChangeStart: (event: DateTimePickerEvent, date?: Date) => void;
  /**
   * Callback, wenn im DateTimePicker ein neues End-Datum gewählt wird.
   * @param event das Picker-Event
   * @param date das gewählte Datum (oder undefined beim Abbrechen)
   */
  onChangeEnd: (event: DateTimePickerEvent, date?: Date) => void;
}

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
  return (
    <View className="rounded-lg p-4 items-center">
      {/* Header mit Titel */}
      <View className="mb-4">
        <Text className="text-lg">
          Select the Departure and Return date of your Journey:
        </Text>
      </View>
      {/* <View style={[styles.date, styles.dayFlexBox]}>
        <Text style={[styles.weekDayDay, styles.dayFlexBox]}>Enter dates</Text>
        <View style={styles.iconButton}>
            <FontAwesome name="calendar" size={24} color="black" />
        </View>
      </View> */}

      {/* Start- und End-Datum */}
      <View className='flex-row items-center justify-between'>
        {/* Start */}
        <View className='flex-1 text-center'>
          <Text className='text-base font-bold my-1 ml-1'>Departure</Text>
          <Pressable className="border-2 border-black rounded" onPress={onStartPress}>
            <View className='items-center justify-center h-12'>
              <Text className='text-base font-bold'>
                {startDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={{ width: 16 }} />

        {/* Ende */}
        <View className='flex-1 text-center'>
          <Text className='text-base font-bold my-1 ml-1'>Return</Text>
          <Pressable className="border-2 border-black rounded" onPress={onEndPress}>
            <View className='items-center justify-center h-12'>
              <Text className='text-base font-bold'>
                {endDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Native Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onChangeStart}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onChangeEnd}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({});