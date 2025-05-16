import { Post } from '@/interfaces/forum';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-swiper';
import ImageViewer from 'react-native-image-zoom-viewer';

interface PostCardProps {
  post: Post
}

const Rating = ({ rating }: { rating: number }) => {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: rating }).map((_, index) => (   
        <FontAwesome key={index} name="star" size={16} color="gold" className="mr-1"/>
      ))}
    </View>
  )
}

const PostCard = ({ post }: PostCardProps) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  return (
    <>
      <View className="bg-white rounded-lg p-4 shadow-md m-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold">{post.title}</Text>
          <Rating rating={post.rating} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">{post.author}</Text>
          <Text className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString("de-DE")}</Text>
        </View>

        {(post.images && post.images.length > 0 || post.content) && (
          <>
            <View className="h-[1px] bg-gray-200 my-2" />

            {post.content && (
              <Text className="text-sm text-gray-500 mb-4">{post.content}</Text>
            )}

            {post.images && post.images.length > 0 && (
              <>
                <View className="flex-row justify-between">
                  {post.images.map((image, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => handleImagePress(index)}
                    >
                      <Image 
                        source={{ uri: image }} 
                        className="w-32 h-24 rounded-lg" 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Image Carousel Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <ImageViewer
          imageUrls={post.images?.map((image) => ({ url: image })) || []}
          index={selectedImageIndex}
          enableSwipeDown
          onSwipeDown={() => setShowImageModal(false)}
          renderHeader={() => (
            <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}>
              <TouchableOpacity
                className="bg-white/30 rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setShowImageModal(false)}
              >
                <FontAwesome name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          onCancel={() => setShowImageModal(false)}
          renderIndicator={(currentIndex, allSize) => (
            <Text style={{ position: 'absolute', top: 50, left: 20, color: '#fff' }}>
              {currentIndex} / {allSize}
            </Text>
          )}
          saveToLocalByLongPress={false} // disable default save option
        />
      </Modal>
    </>
  )
}

export default PostCard

const styles = StyleSheet.create({
});
