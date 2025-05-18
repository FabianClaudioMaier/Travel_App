import { Cities } from '@/interfaces/destinations';
import api from '@/services/api';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';
import { Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

    const fetchCities = async () => {
      const citiesList = await api.destinations.getCitiesByRegion(region_id);
      setCities(citiesList);
    };

    useEffect(() => {
      fetchCities();
    }, []);

    // 1) auto-open, wenn die Prop gesetzt ist
    useLayoutEffect(() => {
      if (autoOpen) {
        setModalVisible(true)
      }
    }, [autoOpen])

    // 2) initialCityId in den Picker-State übernehmen
    useEffect(() => {
      if (initialCityId) {
        setSelectedCity(initialCityId)
      }
    }, [initialCityId])

    // 3) initialDate ins Date-Picker-State übernehmen
    useEffect(() => {
      if (initialDate) {
        const d = new Date(initialDate)
        if (!isNaN(d.getTime())) {
          setDate(d)
        }
      }
    }, [initialDate])

    useImperativeHandle(ref, () => ({
      openModal: () => setModalVisible(true),
    }));

    const submitPost = async () => {
      const newErrors: any = {};
      if (!title.trim()) newErrors.title = 'Title is required';
      if (rating === 0) newErrors.rating = 'Rating is required';
      if (!selectedCity) newErrors.city = 'City is required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      try {
        let uploadedImageUrls: string[] = [];
        if (images.length > 0) {
          const imageUploadResult = await api.forum.uploadImages(images);
          uploadedImageUrls = imageUploadResult.image_urls;
        }

        const data = {
          region_id,
          city_id: selectedCity,
          title,
          content,
          rating,
          date: date.toISOString(),
          author: 'TEST USER',
          images: uploadedImageUrls,
        };

        const res = await api.forum.createPost(data);
        if (res.success) {
          Alert.alert('Success', res.message);
          cleanForm();
          onPostCreated?.();
        } else {
          Alert.alert('Error', res.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    };

    const cleanForm = () => {
      setTitle('');
      setContent('');
      setRating(0);
      setImages([]);
      setErrors({});
      setModalVisible(false);
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
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setImages((imgs) => [...imgs, result.assets[0].uri]);
      }
    };

    return (
        <>
            {/* Floating Button */}
            <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)}>
                <View className="flex-row items-center">
                    <FontAwesome name="pencil" size={24} color="#000" />
                    <Text className="text-black ml-2">Write a Post</Text>
                </View>
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white rounded-xl p-8 w-11/12 relative">
                        <TouchableOpacity
                            onPress={() => {
                                setModalVisible(false);
                                cleanForm();
                            }}
                            className="absolute right-4 top-4"
                        >
                            <FontAwesome name="times" size={24} color="#666" />
                        </TouchableOpacity>

                        <Text className="text-2xl font-bold text-center mb-4">Write a Post</Text>

                        <View className="flex-col gap-6">
                            {/* Title */}
                            <View>
                                <TextInput
                                    className="text-lg font-bold border-b border-gray-300 p-2"
                                    placeholder="Add a Title..."
                                    placeholderTextColor="#666"
                                    value={title}
                                    onChangeText={setTitle}

                                />
                                {errors.title && <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>}
                            </View>

                            {/* City */}
                            <View>
                                <Text className="text-lg font-bold text-gray-600 mb-1">What cities did you visit?</Text>
                                <Picker
                                    selectedValue={selectedCity}
                                    onValueChange={setSelectedCity}
                                >
                                    {cities.map((city) => (
                                        <Picker.Item key={city.id} label={city.city_name} value={city.id} />
                                    ))}
                                </Picker>
                            </View>

                            {/* When did you visit? */}
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-bold text-gray-600">When did you visit?</Text>

                                {Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setDate(selectedDate)
                                                setShowPicker(false)
                                            }
                                        }}
                                    />
                                ) : (
                                    <Pressable
                                        className="border border-gray-300 rounded-lg p-2"
                                        onPress={() => {
                                            setShowPicker(true)
                                            setDate(new Date())
                                        }}
                                    >
                                        <Text className="text-base text-gray-700">
                                            {date.toLocaleDateString()}
                                        </Text>
                                    </Pressable>
                                )}

                                {showPicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setDate(selectedDate)
                                                setShowPicker(false)
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            {/* How was your experience? */}
                            <View>
                                <Text className="text-lg font-bold text-gray-600 mb-1">How was your experience?</Text>
                                {errors.rating && <Text className="text-red-500 text-sm mt-1">{errors.rating}</Text>}
                                <View className="flex-row items-center justify-center mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setRating(star)}
                                            className="mr-2"
                                        >
                                            <FontAwesome
                                                name={rating >= star ? "star" : "star-o"}
                                                size={32}
                                                color={rating >= star ? "#FFD700" : "#666"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Tell us about your experience */}
                            <View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-lg font-bold text-gray-600 mb-1">Tell us about your experience</Text>
                                    <Text className="text-sm text-gray-500 mb-1 mr-2 text-right">(Optional)</Text>
                                </View>
                                <TextInput
                                    className="h-24 border border-gray-300 rounded-lg p-2 text-lg"
                                    placeholder="Describe your expirience.."
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={content}
                                    onChangeText={setContent}
                                />
                            </View>

                            {/* Add Photos */}
                            <View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-lg font-bold text-gray-600 mb-1">Add Photos</Text>
                                    <Text className="text-sm text-gray-500 mb-1 mr-2 text-right">(Optional)</Text>
                                </View>
                                <View className="flex-row gap-2 flex-wrap">
                                    {images.map((uri, index) => (
                                        <View key={index} style={{ position: 'relative' }}>
                                            <Image
                                                source={{ uri }}
                                                className="w-24 h-24 rounded-lg"
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    borderRadius: 999999,
                                                    padding: 2,
                                                    width: 20,
                                                    height: 20,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                onPress={() => {
                                                    const newImages = [...images];
                                                    newImages.splice(index, 1);
                                                    setImages(newImages);
                                                }}
                                            >
                                                <FontAwesome name="close" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {images.length < 3 && (
                                        <TouchableOpacity
                                            className="bg-gray-200 h-24 w-24 border border-gray-300 rounded-lg items-center justify-center"
                                            onPress={pickImage}
                                        >
                                            <FontAwesome5 name="plus" size={24} color="#666" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Publish Button */}
                            <TouchableOpacity
                                className="bg-blue-500 p-3 rounded-lg"
                                onPress={submitPost}
                            >
                                <Text className="text-white text-center font-semibold text-lg">Publish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    )
}

const CreatePostButton = forwardRef(createPostButtonRender);
export default CreatePostButton;

const styles = StyleSheet.create({
    floatingButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 40,
        right: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});