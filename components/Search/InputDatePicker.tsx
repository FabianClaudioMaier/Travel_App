import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

export interface InputDatePickerProps {
  /** Current start date */
  startDate: Date;
  /** Current end date */
  endDate: Date;
  /** Show start date picker? */
  showStartPicker: boolean;
  /** Show end date picker? */
  showEndPicker: boolean;
  /** Called when start date button is pressed */
  onStartPress: () => void;
  /** Called when end date button is pressed */
  onEndPress: () => void;
  /** Called when start date is changed */
  onChangeStart: (event: DateTimePickerEvent, date?: Date) => void;
  /** Called when end date is changed */
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
  const [isEndDateDisabled, setIsEndDateDisabled] = useState(true);

  useEffect(() => {
    // Enable end date if start date is set
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setIsEndDateDisabled(startDate.getTime() <= today.getTime());
  }, [startDate]);

  return (
    <View className="rounded-lg p-4 items-center">
      {/* Header mit Titel */}
      <View className="mb-4">
        <Text className="text-lg font-bold text-gray-500 text-center mb-2">
          Select the Departure and Return date of your Journey:
        </Text>
      </View>

      {/* Start- und End-Datum */}
      <View className='flex-row items-center justify-between'>
        {/* Start */}
        <View className='flex-1 text-center'>
          <Text className='text-base font-bold my-1 ml-1'>Departure</Text>
          <Pressable
            className="border-2 border-black rounded"
            onPress={onStartPress}
          >
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
          <Pressable
            className={`border-2 border-black rounded ${isEndDateDisabled ? 'opacity-50' : ''}`}
            onPress={onEndPress}
            disabled={isEndDateDisabled}
          >
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

const styles = StyleSheet.create({});