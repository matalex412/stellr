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
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

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

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    var names = await firebase
      .database()
      .ref("names")
      .once("value");
    names = names.toJSON();
    if (names == null) {
      names = [];
    } else {
      names = Object.values(names);
    }

    this.setState({ names });
  };

  handleSignUp = async () => {
    try {
      var names = this.state.names;
      var unique = true;
      var name;
      // check display name is unique
      for (name of names) {
        if (name == this.state.username) {
          unique = false;
          break;
        }
      }

      if (unique) {
        await firebase
          .auth()
          .createUserWithEmailAndPassword(
            this.state.email,
            this.state.password
          );
        var user = firebase.auth().currentUser;

        firebase
          .database()
          .ref("users/" + user.uid + "/learning")
          .push({
            postid: "-M9sLloRcBSCZhf9QQjT",
            thumbnail:
              "https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/posts%2FMeta%2F-M9sLloRcBSCZhf9QQjT%2FThumbnail?alt=media&token=8588020f-a02a-467c-8da5-26462b77b061",
            title: "Using Skoach",
            topic: "/Meta"
          });
        firebase
          .database()
          .ref("users/" + user.uid + "/learning")
          .push({
            postid: "-M9Ehcn1WiABy_0wDMKN",
            thumbnail:
              "https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/posts%2FMeta%2F-M9Ehcn1WiABy_0wDMKN%2FThumbnail?alt=media&token=e206b115-cb63-4098-abfe-c7f4b63bcd84",
            title: "Creating a Tutorial",
            topic: "/Meta"
          });

        await user.updateProfile({
          displayName: this.state.username
        });

        firebase
          .database()
          .ref("users/" + user.uid)
          .update({
            messages: {"Please verify your email": "unread"},
            username: this.state.username,
            verified: "pending"
          });
        await store.dispatch(updateTutorials({ unread: true }));

        names.push(this.state.username);
        firebase
          .database()
          .ref("/")
          .update({ names: names });

        user.sendEmailVerification();
      } else {
        this.setState({ errorMessage: "Sorry, that username has been taken" });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message });
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
        <Text style={{ fontSize: 19, color: "white" }}>Sign Up</Text>
        {this.state.errorMessage && (
          <Text style={{ margin: 10, color: "red" }}>
            {this.state.errorMessage}
          </Text>
        )}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            flexWrap: "wrap"
          }}
        >
          <Ionicons name="md-person" size={25} color="white" />
          <TextInput
            placeholder="Username"
            autoCapitalize="none"
            style={styles.textInput}
            onChangeText={username => this.setState({ username })}
            value={this.state.username}
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
          <Ionicons name="md-mail" size={25} color="white" />
          <TextInput
            keyboardType="email-address"
            placeholder="Email"
            autoCapitalize="none"
            style={styles.textInput}
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
          <Ionicons name="md-lock" size={25} color="white" />
          <TextInput
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
            style={styles.textInput}
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.5}
          onPress={this.handleSignUp}
        >
          <Text style={{ color: "white", fontSize: 20 }}> Sign Up </Text>
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
            onPress={() => this.props.navigation.navigate("Login")}
          >
            <Text style={{ color: "white" }}>Login</Text>
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center"
  },
  textInput: {
    fontSize: 18,
    width: "60%",
    marginLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "white",
    color: "white"
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

export default connect(mapStateToProps)(SignUp);
