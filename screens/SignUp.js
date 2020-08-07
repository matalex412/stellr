import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
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
    errorMessage: null,
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // get array of taken usernames
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
    this.setState({ errorMessage: null });
    try {
      var names = this.state.names;
      var unique = true;
      var name;

      // check display name is unique
      if (names.includes(this.state.username)) {
        unique = false;
      }

      if (unique) {
        // create user
        await firebase
          .auth()
          .createUserWithEmailAndPassword(
            this.state.email,
            this.state.password
          );
        var user = firebase.auth().currentUser;

        // update username
        await user.updateProfile({
          displayName: this.state.username,
        });

        var interests = {};
        interests.creators = [];
        interests.topics = ["/topics/Meta", "/topics/Art"];

        // create base user data in firestore database
        var lower = this.state.username.toLowerCase();
        lower = lower.trim();
        await firebase
          .firestore()
          .collection("users/")
          .doc(user.uid)
          .set({
            lowercaseName: lower,
            username: this.state.username,
            interests: interests,
          });

        // add help tutorials to user screen
        await firebase
          .firestore()
          .collection("users/" + user.uid + "/data")
          .doc("learning")
          .set({
            "2fJyrGMwyU8bKKImOtb2": {
              title: "Using Skoach",
              thumbnail:
                "https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/posts%2FMeta%2F-M9sLloRcBSCZhf9QQjT%2FThumbnail?alt=media&token=8588020f-a02a-467c-8da5-26462b77b061",
              topic: "topics/Meta",
            },
            iuyEJIBF63QJRhcBNNQ6: {
              title: "Creating a Tutorial",
              thumbnail:
                "https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/posts%2FMeta%2F-M9Ehcn1WiABy_0wDMKN%2FThumbnail?alt=media&token=e206b115-cb63-4098-abfe-c7f4b63bcd84",
              topic: "topics/Meta",
            },
          });

        // send user message to verify email
        await firebase
          .firestore()
          .collection("users/" + user.uid + "/data")
          .doc("messages")
          .set({
            [Date.now()]: {
              message: "Please verify your email",
              status: "unread",
            },
          });
        await store.dispatch(updateTutorials({ unread: true }));

        // update list of taken usernames
        names.push(this.state.username);
        firebase
          .database()
          .ref("/")
          .update({ names: names });

        // send user email verification
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
          colors={["#6da9c9", "#fff"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "100%",
          }}
        />
        <Text style={{ fontSize: 19, color: "white" }}>Sign Up</Text>
        {this.state.errorMessage && (
          <Text
            style={{
              textAlign: "center",
              margin: 10,
              color: "#ffb52b",
              fontWeight: "bold",
            }}
          >
            {this.state.errorMessage}
          </Text>
        )}
        <View
          style={{
            alignItems: "center",
            backgroundColor: "white",
            padding: 20,
            width: "80%",
            marginTop: 10,
            marginBottom: 20,
            borderRadius: 5,
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
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
              <Ionicons name="md-person" size={25} color="#6da9c9" />
            </View>
            <TextInput
              placeholder="Username"
              autoCapitalize="none"
              style={styles.textInput}
              onChangeText={(username) => this.setState({ username })}
              value={this.state.username}
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
            <View style={{ alignItems: "center", width: 25, height: 25 }}>
              <Ionicons name="md-mail" size={25} color="#6da9c9" />
            </View>
            <TextInput
              keyboardType="email-address"
              placeholder="Email"
              autoCapitalize="none"
              style={styles.textInput}
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
            <View style={{ alignItems: "center", width: 25, height: 25 }}>
              <Ionicons name="md-lock" size={25} color="#6da9c9" />
            </View>
            <TextInput
              secureTextEntry
              placeholder="Password"
              autoCapitalize="none"
              style={styles.textInput}
              onChangeText={(password) => this.setState({ password })}
              value={this.state.password}
            />
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.5}
            onPress={this.handleSignUp}
          >
            <Text style={{ color: "white", fontSize: 20 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <TouchableOpacity
            style={{ margin: 5 }}
            onPress={() => this.props.navigation.navigate("Login")}
          >
            <Text style={{ color: "#6da9c9" }}>Login</Text>
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
    backgroundColor: "#fff",
  },
  submitButton: {
    marginTop: 10,
    paddingTop: 2,
    paddingBottom: 3,
    paddingLeft: 70,
    paddingRight: 70,
    backgroundColor: "#ffb52b",
    borderRadius: 2,
  },
  textInput: {
    fontSize: 18,
    width: "80%",
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#6da9c9",
    color: "#6da9c9",
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

export default connect(mapStateToProps)(SignUp);
