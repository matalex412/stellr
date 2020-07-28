import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
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
    errorMessage: null,
    selection: {start: 1, end: 1}
  };

  handleLogin = async () => {
    if ((this.state.email.length > 1) && (this.state.password.length > 1)) {
      try {
        // sign user in
        await firebase
          .auth()
          .signInWithEmailAndPassword(this.state.email, this.state.password);
      } catch (error) {
        // display errors
        this.setState({ errorMessage: error.message });
      }
    } else {
      this.setState({ errorMessage: "Please fill in the email and password fields"})
    }
  };

  handleSelectionChange = async ({ nativeEvent: { selection } }) => {
    await this.setState({ selection })
  }

  render() {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#6da9c9", "#fff"]}
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
          <Text style={{ margin: 10, color: "#ffb52b", fontWeight: "bold" }}>
            {this.state.errorMessage}
          </Text>
        )}
        <View
          style={{
            alignItems: "center",
            backgroundColor: "white",
            padding: 20,
            margin: 40,
            marginTop: 10,
            marginBottom: 20,
            borderRadius: 5
          }}
        >
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
              <Ionicons name="md-mail" size={25} color="#6da9c9" />
            </View>
            <TextInput
              selection={this.state.selection}
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              onChangeText={email => this.setState({ email })}
              value={this.state.email}
              onSelectionChange={this.handleSelectionChange}
              onEndEditing={() => this.setState({ selection: {start: 1, end: 1}})}
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
              <Ionicons name="md-lock" size={25} color="#6da9c9" />
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
                <Text style={{ color: "#6da9c9" }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.5}
            onPress={this.handleLogin}
          >
            <Text style={{ color: "white", fontSize: 20 }}>Login</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={{ color: "#6da9c9" }}>Sign Up</Text>
          </TouchableOpacity>
          <Text style={{ margin: 5, color: "#6da9c9" }}>|</Text>
          <TouchableOpacity
            style={{ margin: 5 }}
            onPress={() => this.props.navigation.navigate("App")}
          >
            <Text style={{ color: "#6da9c9" }}>Continue Anonymously</Text>
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
    paddingLeft: 70,
    paddingRight: 70,
    backgroundColor: "#ffb52b",
    borderRadius: 2
  },
  textInput: {
    fontSize: 18,
    width: "80%",
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#6da9c9",
    color: "#6da9c9"
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
