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

  render() {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 19 }}>Login to Skoach</Text>
        {this.state.errorMessage && (
          <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
        )}
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          secureTextEntry
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Password"
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button
          title="Login"
          color={this.props.tutorials.color}
          onPress={this.handleLogin}
        />
        <TouchableOpacity
          style={{ margin: 10 }}
          onPress={() => this.props.navigation.navigate("SignUp")}
        >
          <Text style={{ color: "cornflowerblue" }}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.navigation.navigate("App")}
        >
          <Text style={{ color: "cornflowerblue" }}>
            Continue without an Account
          </Text>
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
    margin: 5,
    fontSize: 18,
    borderWidth: 0.5,
    padding: 5
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(LoginScreen);
