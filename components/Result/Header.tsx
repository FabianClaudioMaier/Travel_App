import * as React from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Get device screen width for responsive layouts (if needed)
const { width } = Dimensions.get('window');

// Props for Header component
type HeaderProps = {
  region: string;      // Location/region to display in the header
  dateRange: string;   // Date range string, e.g., "Apr 1 - Apr 7"
  guests: string;      // Guest count label, e.g., "2 guests"
};

/**
 * Header component displays a search-like bar with an icon and details.
 * - Shows a search icon on the left.
 * - Displays region, dates, and guest summary.
 * - Ensures text is truncated with ellipsis if too long.
 */
const Header: React.FC<HeaderProps> = ({ region, dateRange, guests }) => (
  // Outer container with rounded background
  <View style={styles.search}>
    {/* Inner row aligning icon and text details */}
    <View style={[styles.search1, styles.searchFlexBox]}>
      {/* Search icon from Ionicons */}
      <Ionicons name="search" size={48} color="grey" />

      {/* Text container for region, date, and guests */}
      <View style={styles.textContainer}>
        {/* Display region name, replacing underscores and truncating overflow */}
        <Text style={styles.textPrimary} numberOfLines={1}>
          {region.replaceAll('_', ' ')}
        </Text>

        {/* Display selected date range */}
        <Text style={styles.textSecondary} numberOfLines={1}>
          {dateRange}
        </Text>

        {/* Display number of guests */}
        <Text style={styles.textSecondary} numberOfLines={1}>
          {guests}
        </Text>
      </View>
    </View>
  </View>
);

// Stylesheet for Header component
const styles = StyleSheet.create({
  // Aligns children horizontally with spacing
  searchFlexBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  // Primary text: region name
  textPrimary: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  // Secondary text: date range and guests
  textSecondary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(0,0,0,0.7)',
  },
  // Outer container background and padding
  search: {
    borderRadius: 12,
    backgroundColor: '#dfdfdf',
    width: '100%',
    padding: 10,
  },
  // Inner row container for icon and texts
  search1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Optional: text container to group text elements
  textContainer: {
    flex: 1,
  },
});

export default Header;