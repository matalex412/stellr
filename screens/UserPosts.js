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

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPosts extends React.Component {
  state = {
    isLoading: true
  };

  componentDidMount = () => {
    this.setup();
  };

  // no posts case
  setup = async () => {
    const { currentUser } = firebase.auth();
    var data = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/made")
      .once("value");
    data = data.toJSON();

    if (posts == null) {
      postrefs = [];
    } else {
      var postrefs = Object.values(data);
    }

    var postref;
    var posts = [];
    for (postref of postrefs) {
      var post = await firebase
        .database()
        .ref("posts" + postref.topic + "/" + postref.postid)
        .once("value");
      post = post.toJSON();
      if (post != null) {
        posts.push(post);
      }
    }
    await this.setState({ posts });
    this.setState({ isLoading: false });
  };

  handlePress = post => {
    store.dispatch(updateTutorials({ userpost: post }));
    this.props.navigation.navigate("UserTutorial");
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : this.state.posts.length < 1 ? (
          <View style={{ alignItems: "center" }}>
            <Text>You haven't made any yet</Text>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("Create")}
            >
              <Text style={{ color: "cornflowerblue" }}>Make one now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          this.state.posts.map((post, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={() => this.handlePress(post)}
              >
                <View>
                  <Text>{post.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })
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
