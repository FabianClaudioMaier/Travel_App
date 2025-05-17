import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import containerImg from '../../assets/images/container.png';

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
    <SafeAreaView style={[styles.inputDatePicker]}>
      {/* Header mit Titel */}
      <View style={styles.header}>
        <Text style={styles.selectDate}>
          Select the Start and Enddate of your Journey:
        </Text>
      </View>
      <View style={[styles.date, styles.dayFlexBox]}>
        <Text style={[styles.weekDayDay, styles.dayFlexBox]}>Enter dates</Text>
        <View style={styles.iconButton}>
            <Image source={containerImg} style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Start- und End-Datum */}
      <View style={styles.dateReturn}>
        {/* Start */}
        <View style={[styles.textField]}>
          <Pressable style={[styles.textField1]} onPress={onStartPress}>
            <View style={[styles.stateLayer]}>
              <Text style={styles.textTypo}>
                {startDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
          <Text style={styles.supportingText1}>Startdate</Text>
        </View>

        {/* Spacer */}
        <View style={{ width: 16 }} />

        {/* Ende */}
        <View style={[styles.textField]}>
          <Pressable style={[styles.textField1]} onPress={onEndPress}>
            <View style={[styles.stateLayer]}>
              <Text style={styles.textTypo}>
                {endDate.toLocaleDateString('de-DE')}
              </Text>
            </View>
          </Pressable>
          <Text style={styles.supportingText1}>Enddate</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputDatePicker: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
    opacity: 0.8
  },
  header: {
    paddingBottom: 8,
    marginBottom: 12,
  },
  selectDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4b4b4b',
    alignSelf: 'center'
  },
  dateReturn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textField: {
    flex: 1,
  },
  textField1: {
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  stateLayer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  textTypo: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  supportingText1: {
    marginTop: 4,
    fontSize: 12,
    color: '#49454f',
  },
  localActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 40,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  labelText1: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayFlexBox: {
      flex: 1,
      alignSelf: "stretch",
      alignItems: "center"
  },
  weekDayDay: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: "Inter-Regular",
      color: "#000",
      textAlign: "left",
      display: "flex",
      alignItems: "center"
  },
  iconButton: {
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center"
  },
  date: {
      width: "100%",
      flexDirection: "row",
      gap: 1,
      alignItems: "center"
  }
});