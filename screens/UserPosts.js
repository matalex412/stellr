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
    isLoading: true
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    const { currentUser } = firebase.auth();
    var madeRef = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/made");
    await madeRef.on("value", async snapshot => {
      this.setState({ isLoading: true });
      var data = snapshot.val();

      if (data == null) {
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
          post.postid = postref.postid;
          post.topic = postref.topic;
          post.old_topic = postref.topic;
          posts.push(post);
        }
      }
      await this.setState({ posts });
      this.setState({ madeRef });
      this.setState({ isLoading: false });
    });
  };

  handlePress = async post => {
    await store.dispatch(updateTutorials({ userpost: post }));
    this.props.navigation.navigate("UserTutorial");
  };

  componentWillUnmount = () => {
    madeRef = this.state.madeRef;
    if (madeRef) {
      madeRef.off("value");
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
          <ActivityIndicator color="#fff" size="large" />
        ) : this.state.posts.length < 1 ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white" }}>You haven't made any yet</Text>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("Create")}
            >
              <Text style={{ color: "coral" }}>Make one now</Text>
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
                  <Text style={{ color: "white", fontSize: 20 }}>
                    {post.title}
                  </Text>
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
  },
  button: {
    borderWidth: 0,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    margin: 0
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(UserPosts);
