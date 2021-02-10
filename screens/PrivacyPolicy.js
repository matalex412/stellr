import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { human, systemWeights } from "react-native-typography";
import { policy } from "./../data";

export default class PrivacyPolicy extends React.Component {
  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.container}>
          {Object.keys(policy).map((title, index) => (
            <View style={{ paddingHorizontal: 20 }} key={index}>
              <Text style={[human.title2, systemWeights.semibold]}>
                {title}
              </Text>
              <Text>{policy[title]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
