import { Text, View, ImageBackground } from "react-native";
import TripConfigurator from "@/components/TripConfigurator";

export default function Index() {
  return (
    <ImageBackground
      source={require('../../assets/images/greek-coast-sunshine.png')}
      style={{ flex: 1, width: '100%', height: '100%' }}
    >
      <View style={{ flex: 1 }}>
        <TripConfigurator />
      </View>
    </ImageBackground>
  );
}
