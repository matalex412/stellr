import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class SignUp extends React.Component {
  state = {
    email: "",
    password: "",
    username: "",
    errorMessage: null
  };

  handleSignUp = async () => {
    try {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password);
      var user = firebase.auth().currentUser;
      await user.updateProfile({
        displayName: this.state.username
      });
      firebase
        .database()
        .ref("users/" + user.uid)
        .set({
          username: this.state.username
        });
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 19 }}>Sign Up</Text>
        {this.state.errorMessage && (
          <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
        )}
        <TextInput
          placeholder="Username"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={username => this.setState({ username })}
          value={this.state.username}
        />
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button
          title="Sign Up"
          color={this.props.tutorials.color}
          onPress={this.handleSignUp}
        />
        <TouchableOpacity
          style={{ margin: 10 }}
          onPress={() => this.props.navigation.navigate("Login")}
        >
          <Text style={{ color: "cornflowerblue" }}>
            Already have an account? Login
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center"
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

export default connect(mapStateToProps)(SignUp);
