import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { firebase } from "./../src/config";

export default class AccountScreen extends React.Component {
  state = {
    errorMessage: null,
    isLoading: true
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // store current user data
    const { currentUser } = await firebase.auth();
    this.setState({ currentUser });
    this.setState({ isLoading: false });
  };

  verifyEmail = () => {
    this.state.currentUser.sendEmailVerification();
    Alert.alert(
      "Verification Email Sent",
      `An email has been sent to ${this.state.currentUser.email} to verify your account`
    );
  };

  delete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account?",
      [
        {
          text: "Yes",
          onPress: async () => {
            var currentUser = this.state.currentUser;

            try {
              // delete user data
              await currentUser.delete();
              await firebase
                .firestore()
                .collection("users")
                .doc(currentUser.uid)
                .delete();
            } catch (error) {
              // display any error
              this.setState({ errorMessage: error.message });
            }
          }
        },
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel"
        }
      ]
    );
  };

  share = async () => {
    // let user share app website
    await Share.share({
      message: "http://matthewalex.com/skoach"
    });
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
            height: "100%"
          }}
        />
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={{ alignItems: "center" }}>
            <View
              style={{ justifyContent: "center", alignItems: "flex-start" }}
            >
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="account"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <View style={{ alignItems: "center" }}>
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>
                      {this.state.currentUser.displayName}
                    </Text>
                    's Account
                  </Text>
                  <View style={{ alignItems: "center", flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>
                      {this.state.currentUser.email}
                    </Text>
                    {!this.state.currentUser.emailVerified && (
                      <TouchableOpacity onPress={this.verifyEmail}>
                        <Text>(unverified)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <TouchableOpacity
                  onPress={() => this.props.navigation.navigate("UserPosts")}
                >
                  <Text style={{ color: "white" }}>Your Posts</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="history"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <TouchableOpacity
                  onPress={() => this.props.navigation.navigate("History")}
                >
                  <Text style={{ color: "white" }}>Learning History</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="logout"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <TouchableOpacity onPress={() => firebase.auth().signOut()}>
                  <Text style={{ color: "white" }}>Logout</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="share"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <TouchableOpacity onPress={this.share}>
                  <Text style={{ color: "white" }}>Share Skoach</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                <MaterialCommunityIcons
                  name="delete"
                  size={30}
                  style={{ margin: 10 }}
                  color="white"
                />
                <TouchableOpacity onPress={this.delete}>
                  <Text style={{ color: "coral", fontWeight: "bold" }}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {this.state.errorMessage && (
              <Text style={{ marginLeft: 50, marginRight: 50, color: "white" }}>
                {this.state.errorMessage}
              </Text>
            )}
          </View>
        )}
      </View>
    );
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
