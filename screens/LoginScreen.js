import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity,
  StatusBar
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class LoginScreen extends React.Component {
  state = {
    email: "",
    password: "",
    errorMessage: null
  };

  handleLogin = async () => {
    try {
      await firebase
        .auth()
        .signInWithEmailAndPassword(this.state.email, this.state.password);
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  forgot = () => {
    if (this.state.email.length > 1) {
      firebase.auth().sendPasswordResetEmail(this.state.email);
      alert(`An password reset email has been sent to ${this.state.email}`);
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
        <Text style={{ fontSize: 19, color: "white" }}>Login</Text>
        {this.state.errorMessage && (
          <Text style={{ margin: 10, color: "red" }}>
            {this.state.errorMessage}
          </Text>
        )}
        <View
          style={{
            justifyContent: "center",
            flexDirection: "row",
            flexWrap: "wrap"
          }}
        >
          <View
            style={{
              paddingTop: 2,
              alignItems: "center",
              width: 25,
              height: 25
            }}
          >
            <Ionicons name="md-mail" size={25} color="white" />
          </View>
          <TextInput
            style={styles.textInput}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            flexWrap: "wrap"
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: 25,
              height: 25
            }}
          >
            <Ionicons name="md-lock" size={25} color="white" />
          </View>
          <TextInput
            secureTextEntry
            style={styles.textInput}
            autoCapitalize="none"
            placeholder="Password"
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
          <View style={{ alignSelf: "flex-end" }}>
            <TouchableOpacity
              style={{ margin: 10, alignSelf: "flex-end" }}
              onPress={() => {
                this.props.navigation.navigate("Forgot");
              }}
            >
              <Text style={{ color: "white" }}>Forgot Password</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.5}
          onPress={this.handleLogin}
        >
          <Text style={{ color: "white", fontSize: 20 }}> Login </Text>
        </TouchableOpacity>
        <View style={styles.line} />
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap"
          }}
        >
          <TouchableOpacity
            style={{ margin: 5 }}
            onPress={() => this.props.navigation.navigate("SignUp")}
          >
            <Text style={{ color: "white" }}>Sign Up</Text>
          </TouchableOpacity>
          <Text style={{ margin: 5, color: "white" }}>|</Text>
          <TouchableOpacity
            style={{ margin: 5 }}
            onPress={() => this.props.navigation.navigate("App")}
          >
            <Text style={{ color: "white" }}>Continue Anonymously</Text>
          </TouchableOpacity>
        </View>
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
  submitButton: {
    marginTop: 10,
    paddingTop: 2,
    paddingBottom: 3,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: "coral",
    borderRadius: 20
  },
  textInput: {
    fontSize: 18,
    width: "60%",
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: "white",
    color: "white"
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "center",
    margin: 10,
    width: "70%"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(LoginScreen);
