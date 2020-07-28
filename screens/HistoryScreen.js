import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPosts extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    postids: []
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
      this.setState({ postids });
      this.setState({ posts });
    }

    this.setState({ isLoading: false });
  };

  handlePress = async key => {
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
          <ActivityIndicator color="#fff" size="large" />
        ) : this.state.posts.length < 1 ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white" }}>
              You haven't learnt any tutorials yet
            </Text>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("Search")}
            >
              <Text style={{ color: "coral" }}>Explore Tutorials</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 20, color: "white" }}>
              Skills you've learnt
            </Text>
            {this.state.postids.map((postid, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => this.handlePress(postid)}
                >
                  <Text style={{ color: "white", fontSize: 17 }}>
                    {this.state.posts[postid].title}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

export default connect(mapStateToProps)(UserPosts);
