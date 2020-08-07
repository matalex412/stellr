import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import CustomLoading from "./components/CustomLoading";
import Ionicons from "react-native-vector-icons/Ionicons";
import TutorialCover from "./components/TutorialCover";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPosts extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    postids: [],
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    const { currentUser } = firebase.auth();

    // get users history
    var doc = await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("history")
      .get();
    if (doc.exists) {
      var postids = Object.keys(doc.data());
      var posts = doc.data();
      postids.sort((a, b) => {
        const timeA = Number(posts[a].time);
        const timeB = Number(posts[b].time);

        let comparison = 0;
        if (timeA > timeB) {
          comparison = 1;
        } else if (timeA < timeB) {
          comparison = -1;
        }
        return comparison;
      });

      var d,
        time,
        times = [];
      for (var postid of postids) {
        time = posts[postid].time;
        d = new Date(time);
        var mins = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
        times.push(`${d.getDate()}/${d.getMonth()}  ${d.getHours()}:${mins}`);
      }

      this.setState({ times });
      this.setState({ postids });
      this.setState({ posts });
    }

    this.setState({ isLoading: false });
  };

  handlePress = async (key) => {
    var postref = this.state.posts[key];
    // get post data
    var doc = await firebase
      .firestore()
      .collection(`${postref.topic}/posts`)
      .doc(key)
      .get();

    // send user to tutorial screen
    await store.dispatch(updateTutorials({ tutorial_topic: postref.topic }));
    await store.dispatch(updateTutorials({ current: doc.data() }));
    await store.dispatch(updateTutorials({ current_key: key }));

    this.props.navigation.navigate("Tutorial");
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
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
        {this.state.isLoading ? (
          <CustomLoading verse="Trust in the Lord with all your heart, and do not lean on your own understanding" />
        ) : this.state.postids.length < 1 ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, color: "white" }}>
              You're history is empty
            </Text>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("Search")}
            >
              <Text style={{ fontSize: 16, color: "#6da9c9" }}>
                Explore Tutorials
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {this.state.postids.map((postid, index) => {
              return (
                <View key={index} style={{ paddingTop: 5 }}>
                  <TutorialCover
                    tutorial={this.state.posts[postid]}
                    onPress={() => this.handlePress(postid)}
                  />
                  <View
                    style={{ justifyContent: "center", flexDirection: "row" }}
                  >
                    <Text style={styles.text}>
                      Time: {this.state.times[index]}{" "}
                    </Text>
                    <Text style={styles.text}>Learnt?</Text>
                    {this.state.posts[postid].complete ? (
                      <Ionicons
                        style={{ padding: 5 }}
                        name="md-checkmark"
                        size={25}
                        color="#ffb52b"
                      />
                    ) : (
                      <Ionicons
                        style={{ padding: 5 }}
                        name="md-close"
                        size={25}
                        color="#ffb52b"
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "Roboto",
    padding: 5,
    fontSize: 17,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(UserPosts);
