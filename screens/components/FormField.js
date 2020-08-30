import React from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";

export default class Field extends React.Component {
  render() {
    return (
      <View style={{ margin: 20, alignItems: "flex-start" }}>
        <Text
          style={{
            ...human.calloutWhiteObject,
            ...systemWeights.bold,
          }}
        >
          Description
        </Text>
        <TextInput
          placeholderTextColor="grey"
          multiline={true}
          value={this.props.tutorials.info}
          placeholder="Write a short description of what the tutorial is about"
          onChangeText={(info) =>
            store.dispatch(updateTutorials({ info: info }))
          }
          style={{
            color: "#6da9c9",
            padding: 5,
            fontSize: 17,
            borderRadius: 4,
            backgroundColor: "white",
            elevation: 2,
            color: "#6da9c9",
          }}
        />
      </View>
    );
  }
}
