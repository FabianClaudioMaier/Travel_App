import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

/**
 * TabLayout
 * Defines the bottom tab navigator for the application.
 * Uses Expo Router's Tabs component and Ionicons for icons.
 */

export default function TabLayout() {
return (
    <Tabs
      screenOptions={{
        // Active and inactive tint colors for tab icons
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          // Style the tab bar border
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        // Hide default header on all tabs
        headerShown: false,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      {/* Result Tab */}
      <Tabs.Screen
        name="result"
        options={{
          title: 'Result',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
        }}
      />
      {/* Community Tab */}
      <Tabs.Screen
        name="community"
        options={{
          headerShown: false,
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}