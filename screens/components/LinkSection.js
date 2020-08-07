import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default class LinkSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{ alignItems: "center", flexDirection: "row" }}>
        <MaterialCommunityIcons
          name={this.props.icon}
          size={30}
          style={{ margin: 10, marginLeft: 0 }}
          color={this.props.color}
        />
        <TouchableOpacity onPress={this.props.onPress}>
          <Text style={{ fontSize: 15, color: this.props.color }}>
            {this.props.text}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
