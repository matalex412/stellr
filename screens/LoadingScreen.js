import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { firebase } from "./../src/config";
import { AppLoading } from "expo";

export default class LoadingScreen extends React.Component {
  componentDidMount() {
    // redirect user to appropriate screens
    firebase.auth().onAuthStateChanged(user => {
      this.props.navigation.navigate(user ? "App" : "SignUp");
    });
  }

  render() {
    return <AppLoading />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
