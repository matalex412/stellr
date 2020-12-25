import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AdMobBanner } from "expo-ads-admob";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import Background from "./components/Background";
import CustomLoading from "./components/CustomLoading";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";
import TutorialCover from "./components/TutorialCover";
import ProfileBanner from "./components/ProfileBanner";

class ProfileHome extends React.Component {
  state = {
    topics: {},
    isLoading: true,
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // get profile data from firestore
    var doc = await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.profile.uid)
      .get();
    var data = doc.data();
    await this.setState({ user: data });

    // format topics of interest
    var topics = {};
    for (var topic of data.interests.topics) {
      var name = topic.split("/topics/").pop();
      var icon = await firebase
        .database()
        .ref(`categories/${name}/icon`)
        .once("value");
      if (icon != null) {
        topics[name] = icon.toJSON();
      }
    }
    await this.setState({ topics });

    // get users most popular post
    var doc2 = await firebase
      .firestore()
      .collectionGroup("posts")
      .where("username", "==", this.props.tutorials.profile.username)
      .orderBy("learns", "desc")
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const user = querySnapshot.docs[0].data();
          const key = querySnapshot.docs[0].id;
          this.setState({ popular: user });
          this.setState({ key });
        }
      });

    this.setState({ isLoading: false });
  };

  handlePress = async () => {
    // send user to tutorial screen
    await store.dispatch(
      updateTutorials({ tutorial_topic: this.state.popular.topic })
    );
    await store.dispatch(updateTutorials({ current: this.state.popular }));
    await store.dispatch(updateTutorials({ current_key: this.state.key }));
    //   this.props.navigation.navigate("AuthStack", { screen: "Login" });

    this.props.navigation.navigate("ProfileTabs", { screen: "Home" });
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Background />
          {this.state.isLoading ? (
            <CustomLoading verse="Love is patient, love is kind" />
          ) : (
            <View style={{ width: "100%", alignItems: "center" }}>
              <ProfileBanner
                bio={this.state.user.bio}
                user={this.state.user}
                size={100}
              />
              {this.state.popular && (
                <View style={{ padding: 10 }}>
                  <Text style={styles.heading}>Most Popular Tutorial</Text>
                  <TutorialCover
                    tutorial={this.state.popular}
                    onPress={this.handlePress}
                  />
                </View>
              )}
              <Text style={styles.heading}>Interests</Text>
              <View
                style={{
                  justifyContent: "center",
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                {Object.keys(this.state.topics).map((topic, index) => {
                  return (
                    <View style={styles.square} key={index}>
                      <MaterialCommunityIcons
                        name={this.state.topics[topic]}
                        size={40}
                        color="#ffb52b"
                      />
                      <View>
                        <Text style={styles.text}>{topic}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    textAlign: "center",
    color: "white",
    fontSize: 15,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 10,
  },
  heading: {
    fontSize: 20,
    alignSelf: "center",
  },
  square: {
    margin: 10,
    width: Dimensions.get("window").width / 3 - 30,
    height: Dimensions.get("window").width / 3 - 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "black",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 10,
    backgroundColor: "black",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(ProfileHome);
