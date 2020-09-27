import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default class TutorialCover extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <View
          style={{
            borderColor: "#fff",
            marginVertical: 5,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            elevation: 3,
          }}
        >
          <Image
            resizeMode={"cover"}
            style={{
              width: "100%",
              height: 200,
            }}
            source={{
              uri: this.props.tutorial.thumbnail,
            }}
          />
          <View
            style={{
              padding: 5,
              width: "100%",
              backgroundColor: "white",
              alignSelf: "center",
            }}
          >
            <Text style={{ color: "#2274A5", fontSize: 20 }}>
              {this.props.tutorial.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    padding: 5,
    justifyContent: "flex-start",
    flexDirection: "row",
  },
});
