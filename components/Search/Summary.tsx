import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SummaryProps {
  people: number;
  region: string;
  stops: string[];
  price: number;
  modes: string[];
  startDate: Date;
  endDate: Date;
}

export default function Summary({
  people,
  region,
  stops,
  price,
  modes,
  startDate,
  endDate,
}: SummaryProps) {
  const monthName = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long' });
  const days =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.container}>
      <Text style={styles.checkTitle}>Please Check!</Text>
      <Text style={styles.heading}>Your Settings:</Text>
      <View style={styles.row}>
        <Ionicons name="person-outline" size={20} />
        <Text style={styles.text}>{people} People</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={20} />
        <Text style={styles.text}>{days} Days</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={20} />
        <Text style={styles.text}>
          {monthName(startDate)}
          {monthName(startDate) !== monthName(endDate) ? `, ${monthName(endDate)}` : ''}
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="logo-euro" size={20} />
        <Text style={styles.text}>€ {price}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="compass-outline" size={20} />
        <Text style={styles.text}>{stops.join(', ')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    alignSelf: 'center'
  },
  checkTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '50%',
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});
