// app/profile.tsx (oder wo auch immer dein ProfileScreen liegt)

import React, { FC } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';

// Profile-Komponenten
import ProfileImage from '@/components/ProfileData/ProfileImage';
import ProfileName from '@/components/ProfileData/ProfileName';
import ProfileEmail from '@/components/ProfileData/ProfileEmail';
import ProfilePassword from '@/components/ProfileData/ProfilePassword';
import ProfileHometown from '@/components/ProfileData/ProfileHometown';
import ProfileAnonymousmode from '@/components/ProfileData/ProfileAnonymousmode';
import ProfileServices from '@/components/ProfileData/ProfileServices';


const ProfileScreen: FC = () => {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>My Profile</Text>

      <ProfileImage />
      <ProfileName />
      <ProfileEmail />
      <ProfilePassword />
      <ProfileHometown />
      <ProfileAnonymousmode />
      <ProfileServices />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
});

export default ProfileScreen;
