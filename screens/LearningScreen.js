import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";
import { Video } from "expo-av";
import { connect } from "react-redux";
import { AdMobBanner } from "expo-ads-admob";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class LearningScreen extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    added: false
  };

  componentDidMount = () => {
    this.vids = [];
    this.setup();
  };

  setup = async () => {
    // get currentuser and post data
    const { currentUser } = firebase.auth();
    const postInfo = this.props.tutorials.added;

    // get tutorial
    var post = await firebase
      .database()
      .ref("posts" + postInfo.topic + "/" + postInfo.postid)
      .once("value");
    post = post.toJSON();

    // check if post exists
    if (post == null) {
      Alert.alert(
        "Error",
        "Sorry, this tutorial has either been deleted or its topic has been changed"
      );
      var ref = await firebase
        .database()
        .ref(
          `users/${currentUser.uid}/learning/${this.props.tutorials.learn_key}`
        );
      ref.remove();
      this.props.navigation.navigate("Home");
    } else {
      this.setState({ currentUser });
      this.setState({ post });
      this.setState({ isLoading: false });

      // update thumbnail if changed
      if (post.thumbnail != postInfo.thumbnail) {
        firebase
          .database()
          .ref(
            `users/${currentUser.uid}/learning/${this.props.tutorials.learn_key}`
          )
          .update({
            thumbnail: post.thumbnail
          });
      }
    }
  };

  learnt = async () => {
    const { currentUser } = firebase.auth();

    // get tutorials user has added
    var posts = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning")
      .once("value");
    posts = posts.toJSON();
    var postkeys = Object.keys(posts);

    // get key of postrefs
    var postkey;
    var refKey;
    for (postkey of postkeys) {
      if (postkey == this.props.tutorials.learn_key) {
        refKey = postkey;
      }
    }

    var postRef = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning/" + refKey);
    postRef.remove();

    // add to learning history
    await firebase
      .database()
      .ref("users/" + currentUser.uid + "/history")
      .push({
        title: this.state.post.title
      });

    this.props.navigation.navigate("Home");
  };

  bannerError = () => {
    console.log("banner ad not loading");
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  addRef = (component, index) => {
    this.vids[index] = component;
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
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
          ) : (
            <View>
              <View style={{ flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/2933794374"
                  onDidFailToReceiveAdWithError={this.bannerError}
                />
              </View>
              <View style={{ flex: 1, alignItems: "center", padding: 10 }}>
                <View
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 20,
                      fontStyle: "italic"
                    }}
                  >
                    {this.state.post.title}
                  </Text>
                  <Text style={{ color: "white" }}>
                    by {this.state.post.username}
                  </Text>
                </View>
                {Object.values(this.state.post.steps).map((step, index) => (
                  <View
                    style={{ alignItems: "center", padding: 10 }}
                    key={index}
                  >
                    <Text style={styles.heading}>Step {index + 1}</Text>
                    {step.Images && (
                      <Image
                        source={{ uri: step.Images }}
                        style={{ margin: 10, width: 200, height: 200 }}
                      />
                    )}
                    {step.Videos && (
                      <Video
                        onPlaybackStatusUpdate={playbackStatus =>
                          this._onPlaybackStatusUpdate(playbackStatus, index)
                        }
                        ref={component => this.addRef(component, index)}
                        source={{ uri: step.Videos }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={false}
                        resizeMode={Video.RESIZE_MODE_CONTAIN}
                        useNativeControls
                        style={{ margin: 10, width: 200, height: 200 }}
                      />
                    )}
                    <Text style={{ color: "white", fontSize: 16 }}>
                      {step.step}
                    </Text>
                  </View>
                ))}
                {this.state.currentUser.isAnonymous ? null : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <View style={{ margin: 5 }}>
                      <Button
                        color="coral"
                        title="Learnt"
                        onPress={() => this.learnt()}
                      />
                    </View>
                  </View>
                )}
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
    backgroundColor: "#fff"
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  heading: {
    fontSize: 16,
    color: "white"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(LearningScreen);
