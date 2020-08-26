import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { createMaterialTopTabNavigator } from "react-navigation-tabs";
import { createAppContainer } from "react-navigation";

import CustomLoading from "./components/CustomLoading";
import ProfileBanner from "./components/ProfileBanner";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class ToAddSection extends React.Component {
  state = {
    toAddLoading: true,
    isLoading: true,
    toAdd: [],
    added: { following: [], friends: [] },
  };

  clickedUser = async (user) => {
    await store.dispatch(updateTutorials({ profile: user }));
    this.props.navigation.navigate("Profile");
  };

  follow = async (user) => {
    var toAdd = this.state.toAdd;
    for (var i = 0; i < toAdd.length; i++) {
      var person = toAdd[i];
      if (person.uid == user.uid) {
        toAdd[i].added = true;
        this.setState({ toAdd: toAdd });
      }
    }

    this.setState({ searched: false });
    this.setState({ result: null });
    var friend,
      { currentUser } = firebase.auth();

    // get the array of users the to-be-added user follows
    var toaddRef = await firebase
      .firestore()
      .collection(`users/${user.uid}/data`)
      .doc("people");
    var doc = await toaddRef.get();
    if (doc.exists) {
      var otherUserFollowing = doc.data();
      if (Object.keys(otherUserFollowing).includes(currentUser.uid)) {
        friend = true;
        toaddRef.update({
          [currentUser.uid]: {
            username: currentUser.displayName,
            profilePic: currentUser.photoURL,
            status: "friend",
          },
        });
      }
    }

    // update user's linked people in firestore
    if (!user.profilePic) {
      user.profilePic = null;
    }
    await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("people")
      .set(
        {
          [user.uid]: {
            username: user.username,
            profilePic: user.profilePic,
            status: friend ? "friend" : "following",
          },
        },
        { merge: true }
      );

    var added = this.state.added;
    if (friend) {
      added.friends.push(user);
    } else {
      added.following.push(user);
    }
    this.setState({ added });
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <View style={styles.contentContainer}>
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
            <CustomLoading verse="Therefore encourage one another and build one another up" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            {this.state.toAddLoading ? (
              <ActivityIndicator
                style={{ margin: 5 }}
                color="#000"
                size="large"
              />
            ) : (
              this.props.toAdd.map((user, index) => {
                return (
                  <View
                    key={index}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    <ProfileBanner
                      style={styles.profile}
                      user={user}
                      onPress={() => this.clickedUser(user)}
                    />
                    {user.added ? (
                      <View
                        style={{
                          backgroundColor: "grey",
                          borderRadius: 20,
                          padding: 5,
                          alignSelf: "center",
                        }}
                      >
                        <Text>Added</Text>
                      </View>
                    ) : this.state.currentUser.isAnonymous ? null : (
                      <TouchableOpacity
                        onPress={() => this.follow(user)}
                        style={{
                          backgroundColor: "#ffb52b",
                          borderRadius: 20,
                          padding: 5,
                          alignSelf: "center",
                        }}
                      >
                        <Text>Add User</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 10,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginTop: 20,
  },
  profile: {
    alignItems: "flex-start",
    width: 200,
    marginRight: 10,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(ToAddSection);
