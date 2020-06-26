import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

import { firebase } from "./../src/config";

export default class ForgotScreen extends React.Component {
  state = {
    email: ""
  };

  forgot = () => {
    if (this.state.email.length > 1) {
      firebase.auth().sendPasswordResetEmail(this.state.email);
      alert(`A password reset email has been sent to ${this.state.email}`);
      this.props.navigation.navigate("Login");
    } else {
      alert("Please enter a valid email address");
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0b5c87", "#6da9c9"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "100%"
          }}
        />
        <View
          style={{
            justifyContent: "center",
            flexDirection: "row",
            flexWrap: "wrap"
          }}
        >
          <Ionicons name="md-mail" size={25} color="white" />
          <TextInput
            style={styles.textInput}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
        </View>
        <TouchableOpacity style={{ margin: 10 }} onPress={this.forgot}>
          <Text style={{ color: "white" }}>Forgot Password</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff"
  },
  textInput: {
    fontSize: 18,
    width: "60%",
    marginLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "white",
    color: "white"
  }
});
