import { Text, View } from "react-native";
import TripConfigurator from "@/components/TripConfigurator";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TripConfigurator />
    </View>
  );
}
