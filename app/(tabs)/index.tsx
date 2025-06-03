// app/index.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import RegionSwiper from '@/components/RegionSwiper';
import TripConfigurator from '@/components/Search/TripConfigurator';
import ResultScreen from '@/components/Result/ResultScreen';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const urlParams = useLocalSearchParams() as Record<string, string>;

  // ================================
  // 1) Hier heben wir selectedRegionId in den Index-Screen:
  // ================================
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [resultParams, setResultParams] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    // Wenn wir mit ?id=… oder ?origin=… hierher kommen, sofort Modal öffnen
    const hasResultParam = !!urlParams.id || !!urlParams.origin;
    if (hasResultParam) {
      setResultParams(urlParams);
      setModalVisible(true);
      // Danach URL „säubern“, damit Modal nicht nochmal aufpoppt
      router.replace({ pathname: '/', params: {} });
    }
  }, [urlParams]);

  const handleShowResult = (params: Record<string, string>) => {
    setResultParams(params);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setResultParams(undefined);
  };

  return (
    <View style={styles.container}>
      {/* ================================
         2) TripConfigurator bekommt jetzt
            ausgewählten Region‐State + Setter
      ================================= */}
      <View style={styles.searchBox}>
        <TripConfigurator
          selectedRegionId={selectedRegionId}
          onRegionChange={setSelectedRegionId}
          onShowResult={handleShowResult}
        />
      </View>

      {/* ================================
         3) RegionSwiper bekommt Callback,
            wenn ein Name geklickt wird
      ================================= */}
      <View style={styles.swiperContainer}>
        <RegionSwiper onRegionPress={setSelectedRegionId} />
      </View>

      {modalVisible && resultParams && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <ResultScreen
            overrideParams={resultParams}
            onClose={handleCloseModal}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    position: 'absolute',
    top: height * 0.05,
    alignSelf: 'center',
    width: width * 0.9,
    minHeight: height * 0.6,
    zIndex: 1,
  },
  swiperContainer: {
    flex: 1,
    zIndex: 0,
  },
});
