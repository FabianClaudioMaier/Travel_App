// components/NumberOfPeople.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from 'react-native';
import IconPlusImg from '../assets/plus.png';
import IconMinusImg from '../assets/minus.png';


export default function MaximalPrice({ numberOfAdults, onChangeNumberOfAdults, numberOfChildren, onChangeNumberOfChildren }) {
  return (
    <View style={styles.container}>
      {/* Erläuterungstexte */}
      <Text style={styles.note}>
        Adults
      </Text>

      {/* manueller Wert */}
      <View style={styles.manualContainer}>
        <TouchableOpacity
          style={[styles.adjustButton, styles.plus]}
          onPress={() => onChangeNumberOfAdults(numberOfAdults + 1)}
        >
          <Image source={IconPlusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
        <Text style={styles.valueText}>{numberOfAdults}</Text>
        <TouchableOpacity
          style={[styles.adjustButton]}
          onPress={() => onChangeNumberOfAdults(Math.max(0, numberOfAdults - 1))}
        >
          <Image source={IconMinusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
      </View>

      {/* Erläuterungstexte */}
      <Text style={styles.note}>
        Children
      </Text>
      <Text style={styles.subNote}>
        12 Years or Younger
      </Text>

      {/* manueller Wert */}
      <View style={styles.manualContainer}>
        <TouchableOpacity
          style={[styles.adjustButton, styles.plus]}
          onPress={() => onChangeNumberOfChildren(numberOfChildren + 1)}
        >
          <Image source={IconPlusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
        <Text style={styles.valueText}>{numberOfChildren}</Text>
        <TouchableOpacity
          style={[styles.adjustButton]}
          onPress={() => onChangeNumberOfChildren(Math.max(0, numberOfChildren - 1))}
        >
          <Image source={IconMinusImg} style={{ width: 70, height: 70 }} />
        </TouchableOpacity>
      </View>



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
