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
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class AccountScreen extends React.Component {
  state = {
    errorMessage: null,
    isLoading: true
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    const { currentUser } = await firebase.auth();
    this.setState({ currentUser });
    this.setState({ isLoading: false });
  };

  logout = async () => {
    await firebase.auth().signOut();
  };

  delete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account?",
      [
        {
          text: "Yes",
          onPress: async () => {
            var currentUser = firebase.auth().currentUser;

            try {
              await currentUser.delete();
              var userRef = await firebase
                .database()
                .ref("users/" + currentUser.uid);
              userRef.remove();
              this.props.navigation.navigate("Auth");
            } catch (error) {
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
    try {
      await Share.share({
        message: "http://matthewalex.com/skoach"
      });
    } catch (err) {
      console.log(err.message);
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
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : this.state.currentUser.isAnonymous ? (
          <View>
            <TouchableOpacity onPress={this.logout}>
              <Text style={{ color: "white", padding: 10 }}>
                Sign up or Create an Account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "flex-start" }}>
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
                <Text style={{ fontWeight: "bold" }}>
                  {this.state.currentUser.email}
                </Text>
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
              <TouchableOpacity onPress={this.logout}>
                <Text style={{ color: "white" }}>Logout</Text>
              </TouchableOpacity>
            </View>
            {this.state.errorMessage && (
              <Text style={{ margin: 10, color: "white" }}>
                {this.state.errorMessage}
              </Text>
            )}
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

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(AccountScreen);
