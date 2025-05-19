// src/components/Header.tsx
import * as React from "react";
import { StyleSheet, Text, View, Pressable, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HeaderProps {
  region: string;
  dateRange: string;
  guests: string;
}

const Header: React.FC<HeaderProps> = ({ region, dateRange, guests }) => (
  <View style={styles.search}>
    <View style={[styles.search1, styles.searchFlexBox]}>
      <Ionicons name="search" size={60} color={'grey'} />
      <View>
        <Text style={styles.text1} numberOfLines={1}>{region.replaceAll('_', ' ')}</Text>
        <Text style={styles.text2} numberOfLines={1}>{dateRange}</Text>
        <Text style={styles.text2} numberOfLines={1}>{guests} Travelers</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  searchFlexBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  text1: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  text2: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  search: {
    borderRadius: 12,
    backgroundColor: "#dfdfdf",
    width: "100%",
    padding: 10,
  },
  search1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

export default Header;
