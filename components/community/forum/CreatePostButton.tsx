// components/CreatePostButton.tsx

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '@/services/api';
import { Cities } from '@/interfaces/destinations';

// Den Schlüssel bitte exakt so halten wie in ProfileName:
const PROFILE_STORAGE_KEY = 'userProfile';

export interface CreatePostButtonHandle {
  openModal: () => void;
}

interface CreatePostButtonProps {
  region_id: string;
  onPostCreated?: () => void;
  autoOpen?: boolean;
  initialCityId?: string;
  initialDate?: string;
}

const createPostButtonRender: React.ForwardRefRenderFunction<
  CreatePostButtonHandle,
  CreatePostButtonProps
> = (
  { region_id, onPostCreated, autoOpen, initialCityId, initialDate },
  ref
) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [showPicker, setShowPicker] = useState(false);

  const [cities, setCities] = useState<Cities>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useImperativeHandle(ref, () => ({
    openModal: () => setModalVisible(true),
  }));

  useEffect(() => {
    api.destinations.getCitiesByRegion(region_id).then(setCities);
  }, [region_id]);

  useLayoutEffect(() => {
    if (autoOpen) setModalVisible(true);
  }, [autoOpen]);

  useEffect(() => {
    if (initialCityId) setSelectedCity(initialCityId);
  }, [initialCityId]);

  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) setDate(d);
    }
  }, [initialDate]);

  const cleanForm = () => {
    setTitle('');
    setContent('');
    setRating(0);
    setImages([]);
    setErrors({});
    setModalVisible(false);
  };

  /**
   * submitPost:
   * - Liest erst aus AsyncStorage, ob anonymousMode gesetzt ist.
   * - Wenn anonymousMode = true, dann author = "Anonymous".
   * - Ansonsten author = profile.name (bzw. profile.email, falls name leer).
   */
  const submitPost = async () => {
    // 1) Validierung:
    const newErrors: any = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!selectedCity) newErrors.city = 'City is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // 2) Bilder hochladen (falls nötig)
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        const imageUploadResult = await api.forum.uploadImages(images);
        uploadedImageUrls = imageUploadResult.image_urls;
      }

      // 3) PROFILE aus AsyncStorage auslesen, um author zu bestimmen
      let authorName = 'Anonymous'; // Default
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const profile = JSON.parse(stored) as {
            name?: string;
            anonymous?: boolean;
          };

          // Wenn der Modus *nicht* anonym ist, dann echten Namen verwenden
          if (!profile.anonymous) {
            authorName = profile.name?.trim()
              ? profile.name
              : 'TEST USER';
          }
        }
      } catch (err) {
        console.warn('Fehler beim Laden des Profils aus Storage:', err);
        // Wir belassen authorName = "Anonymous", falls irgendwas schiefgeht
      }

      // 4) Endgültig die createPost‐API anstoßen
      const res = await api.forum.createPost({
        region_id,
        city_id: selectedCity,
        title,
        content,
        rating,
        date: date.toISOString(),
        author: authorName,
        images: uploadedImageUrls,
      });

      if (res.success) {
        Alert.alert('Success', res.message);
        cleanForm();
        onPostCreated?.();
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (err) {
      console.error('❌ Fehler beim Erstellen des Posts:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 images.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setImages((imgs) => [...imgs, result.assets[0].uri]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="pencil" size={24} color="#000" />
          <Text style={{ color: '#000', marginLeft: 8 }}>Write a Post</Text>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={cleanForm}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
          }}
        >
          <ScrollView
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
              paddingVertical: 50,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                width: '90%',
              }}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={cleanForm}
                style={{ position: 'absolute', top: 12, right: 12 }}
              >
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Write a Post
              </Text>

              {/* Title */}
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  placeholder="Add a Title..."
                  placeholderTextColor="#666"
                  value={title}
                  onChangeText={setTitle}
                  style={{ fontSize: 16, borderBottomWidth: 1, padding: 8 }}
                />
                {errors.title && (
                  <Text style={{ color: 'red' }}>{errors.title}</Text>
                )}
              </View>

              {/* City Picker */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontWeight: 'bold', marginBottom: 4 }}
                >
                  What cities did you visit?
                </Text>
                <Picker
                  selectedValue={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  {cities.map((city) => (
                    <Picker.Item
                      key={city.id}
                      label={city.city_name}
                      value={city.id}
                    />
                  ))}
                </Picker>
                {errors.city && (
                  <Text style={{ color: 'red' }}>{errors.city}</Text>
                )}
              </View>

              {/* Date */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontWeight: 'bold', marginBottom: 4 }}
                >
                  When did you visit?
                </Text>
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Text>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ) : (
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Text>{date.toLocaleDateString()}</Text>
                  </Pressable>
                )}

                {showPicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_event, selectedDate) => {
                      if (selectedDate) setDate(selectedDate);
                      setShowPicker(false);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Rating */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontWeight: 'bold', marginBottom: 4 }}
                >
                  How was your experience?
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginTop: 8,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={{ marginRight: 8 }}
                    >
                      <FontAwesome
                        name={rating >= star ? 'star' : 'star-o'}
                        size={32}
                        color={rating >= star ? '#FFD700' : '#ccc'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Content */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontWeight: 'bold', marginBottom: 4 }}
                >
                  Tell us about your experience
                </Text>
                <TextInput
                  placeholder="Describe your experience..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                  style={{
                    height: 100,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Images */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontWeight: 'bold', marginBottom: 4 }}
                >
                  Add Photos
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={{ position: 'relative' }}>
                      <Image
                        source={{ uri }}
                        style={{ width: 96, height: 96, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const newImages = [...images];
                          newImages.splice(index, 1);
                          setImages(newImages);
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: 9999,
                          padding: 2,
                          width: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FontAwesome name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {images.length < 3 && (
                    <TouchableOpacity
                      onPress={pickImage}
                      style={{
                        width: 96,
                        height: 96,
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        backgroundColor: '#eee',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FontAwesome5 name="plus" size={24} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={submitPost}
                style={{
                  backgroundColor: '#007AFF',
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  Publish
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const CreatePostButton = forwardRef(createPostButtonRender);
export default CreatePostButton;

const styles = StyleSheet.create({
  floatingButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    position: 'absolute',
    bottom: 40,
    right: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
