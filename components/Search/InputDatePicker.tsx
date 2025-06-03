import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

export interface InputDatePickerProps {
  startDate: Date;
  endDate: Date;
  showStartPicker: boolean;
  showEndPicker: boolean;
  onStartPress: () => void;
  onEndPress: () => void;
  onChangeStart: (event: DateTimePickerEvent, date?: Date) => void;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setIsEndDateDisabled(startDate.getTime() <= today.getTime());
  }, [startDate]);

  const renderDatePicker = (
    visible: boolean,
    value: Date,
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    minimumDate: Date
  ) => {
    if (!visible) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                onChange={onChange}
                minimumDate={minimumDate}
              />
              <Pressable
                onPress={() => onChange({ type: 'dismissed', nativeEvent: {} } as any)}
                style={styles.modalDoneButton}
              >
                <Text style={styles.doneText}>Fertig</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={onChange}
        minimumDate={minimumDate}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Select the departure and return dates of your journey:
        </Text>
      </View>

      <View style={styles.row}>
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

        <View style={styles.column}>
          <Text style={styles.label}>Return</Text>
          <Pressable
            style={[styles.pressable, isEndDateDisabled && styles.disabled]}
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

      {/* Date Pickers (platform dependent) */}
      {renderDatePicker(showStartPicker, startDate, onChangeStart, new Date())}
      {renderDatePicker(showEndPicker, endDate, onChangeEnd, startDate)}
    </View>
  );
}

// Styles
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalDoneButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
