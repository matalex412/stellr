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
    posts: []
  };

  componentDidMount = () => {
    this.setup();
  };

  // no posts case
  setup = async () => {
    const { currentUser } = firebase.auth();
    var posts = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/history")
      .once("value");
    posts = posts.toJSON();
    if (posts == null) {
      posts = [];
    } else {
      posts = Object.values(posts);
    }

    this.setState({ posts });
    this.setState({ isLoading: false });
  };

  handlePress = () => {
    this.props.navigation.navigate("Search");
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
            {this.state.posts.map((post, index) => {
              return (
                <View key={index}>
                  <Text style={{ color: "white", fontSize: 17 }}>
                    {post.title}
                  </Text>
                </View>
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
