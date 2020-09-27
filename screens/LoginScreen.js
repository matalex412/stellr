import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { human, systemWeights } from "react-native-typography";

import Background from "./components/Background";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class LoginScreen extends React.Component {
  state = {
    email: "",
    password: "",
    errorMessage: null,
    isLoading: false,
    isPasswordHidden: true,
  };

  handleLogin = async () => {
    this.setState({ isLoading: true });
    this.setState({ errorMessage: null });
    if (this.state.email.length > 1 && this.state.password.length > 1) {
      try {
        // sign user in
        await firebase
          .auth()
          .signInWithEmailAndPassword(this.state.email, this.state.password);
      } catch (error) {
        // create error message
        var message;
        switch (error.code) {
          case "auth/invalid-email":
            message = "That doesn't seem like a valid email address";
            break;
          case "auth/user-disabled":
            message = "This account has been disabled";
            break;
          case "auth/user-not-found":
            message = "Sorry, the account for that email doesn't exist";
            break;
          case "auth/wrong-password":
            message = "Sorry, you've entered the wrong password";
            break;
          case "auth/too-many-requests":
            message = "Too many tries to login. Try again later";
          default:
            message = "Sorry, something went wrong";
        }

        // display errors
        this.setState({ errorMessage: message });
      }
    } else {
      setTimeout(() => {
        this.setState({
          errorMessage: "Please fill in the email and password fields",
        });
      }, 500);
    }
    this.setState({ isLoading: false });
  };

  render() {
    return (
      <View style={styles.container}>
        <Background />
        <Text style={[human.title1White, systemWeights.bold]}>Login</Text>
        <View
          style={{
            alignItems: "center",
            backgroundColor: "white",
            padding: 20,
            width: "80%",
            marginTop: 10,
            borderRadius: 5,
            elevation: 1,
          }}
        >
          <View
            style={{
              justifyContent: "center",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                paddingTop: 2,
                alignItems: "center",
                width: 25,
                height: 25,
              }}
            >
              <Ionicons name="md-mail" size={25} color="#2274A5" />
            </View>
            <TextInput
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              onChangeText={(email) => this.setState({ email })}
              value={this.state.email}
            />
          </View>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                width: 25,
                height: 25,
              }}
            >
              <Ionicons name="md-lock" size={25} color="#2274A5" />
            </View>
            <TextInput
              secureTextEntry={this.state.isPasswordHidden}
              style={styles.textInput}
              autoCapitalize="none"
              placeholder="Password"
              onChangeText={(password) => this.setState({ password })}
              value={this.state.password}
            />
            <TouchableOpacity
              style={{ position: "absolute", right: 5 }}
              onPress={() =>
                this.setState({
                  isPasswordHidden: !this.state.isPasswordHidden,
                })
              }
            >
              <Ionicons
                name={this.state.isPasswordHidden ? "md-eye" : "md-eye-off"}
                size={25}
                color="#2274A5"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{ margin: 5 }}
            onPress={() => {
              this.props.navigation.navigate("Forgot");
            }}
          >
            <Text style={{ color: "#2274A5" }}>Forgot Password?</Text>
          </TouchableOpacity>
          <View style={styles.submitButton}>
            {!this.state.isLoading ? (
              <TouchableOpacity activeOpacity={0.5} onPress={this.handleLogin}>
                <Text style={{ color: "white", fontSize: 20 }}>Login</Text>
              </TouchableOpacity>
            ) : (
              <ActivityIndicator color="white" />
            )}
          </View>
        </View>
        {this.state.errorMessage ? (
          <Text
            style={[
              human.footnote,
              { padding: 5, color: "#e3242b", ...systemWeights.bold },
            ]}
          >
            {this.state.errorMessage}
          </Text>
        ) : (
          <Text
            style={[
              human.footnote,
              { padding: 5, color: "#e3242b", ...systemWeights.bold },
            ]}
          >
            {"  "}
          </Text>
        )}
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <TouchableOpacity
            style={{
              marginHorizontal: 5,
              padding: 4,
              backgroundColor: "white",
              borderRadius: 4,
              elevation: 1,
            }}
            onPress={() => this.props.navigation.navigate("SignUp")}
          >
            <Text style={{ color: "#2274A5" }}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginHorizontal: 5,
              padding: 4,
              backgroundColor: "white",
              borderRadius: 4,
              elevation: 1,
            }}
            onPress={() => this.props.navigation.navigate("App")}
          >
            <Text style={{ color: "#2274A5" }}>Continue Anonymously</Text>
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
    backgroundColor: "#fff",
  },
  submitButton: {
    height: 28,
    justifyContent: "center",
    width: "80%",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#ffb52b",
    borderRadius: 2,
  },
  textInput: {
    fontSize: 18,
    width: "80%",
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#2274A5",
    color: "#2274A5",
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "center",
    margin: 10,
    width: "70%",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LoginScreen);
