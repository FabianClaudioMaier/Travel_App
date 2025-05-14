import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

const CommunityDetail = () => {
  const { id } = useLocalSearchParams()

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20 }}>Region ID: {id}</Text>
      {/* You can fetch and show more region details here */}
    </View>
  )
}

export default CommunityDetail