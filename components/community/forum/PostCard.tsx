import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Post } from '@/interfaces/forum'
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
  return (
    <View className="bg-white rounded-lg p-4 shadow-md m-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold">{post.title}</Text>
        <Rating rating={post.rating} />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">{post.author}</Text>
        <Text className="text-sm text-gray-500">{post.date}</Text>
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
                  <Image key={index} source={{ uri: image }} className="w-32 h-24 rounded-lg" />
                ))}
              </View>
            </>
          )}

        </>
      )}
    </View>
  )
}

export default PostCard

const styles = StyleSheet.create({})