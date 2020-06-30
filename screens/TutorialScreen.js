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

class TutorialScreen extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    added: false
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // get currentuser data
    const { currentUser } = firebase.auth();

    // get tutorials user has added
    var posts;
    await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning")
      .on("value", async snapshot => {
        this.setState({ isLoading: true });
        posts = snapshot.val();
        if (posts != null) {
          posts = Object.values(posts);
        } else {
          posts = [];
        }

        // check if current post has been added by user
        var post;
        for (post of posts) {
          if (post.postid == this.props.tutorials.current_key) {
            this.setState({ added: true });
          }
        }

        this.setState({ currentUser });
        this.setState({ isLoading: false });
      });
  };

  addHome = async () => {
    const { currentUser } = await firebase.auth();

    await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning")
      .push({
        postid: this.props.tutorials.current_key,
        topic: this.props.tutorials.tutorial_topic,
        title: this.props.tutorials.current.title,
        thumbnail: this.props.tutorials.current.thumbnail
      });

    Alert.alert("Added", "This tutorial has been added to your home");
    this.setState({ added: true });
  };

  learnt = async userLearnt => {
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
      if (posts[postkey].postid == this.props.tutorials.current_key) {
        refKey = postkey;
      }
    }

    var postRef = firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning/" + refKey);
    postRef.remove();

    if (userLearnt) {
      // add to learning history
      await firebase
        .database()
        .ref("users/" + currentUser.uid + "/history")
        .push({
          title: this.props.tutorials.current.title
        });
    }

    this.props.navigation.navigate("Search");
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
    this.vids = [];
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
              <View style={{ margin: 10, flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/2933794374"
                  onDidFailToReceiveAdWithError={this.bannerError}
                  servePersonalizedAds
                />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    paddingTop: 10,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 20,
                      fontStyle: "italic"
                    }}
                  >
                    {this.props.tutorials.current.title}
                  </Text>
                  <Text style={{ color: "white" }}>
                    by {this.props.tutorials.current.username}
                  </Text>
                </View>
                {Object.values(this.props.tutorials.current.steps).map(
                  (step, index) => (
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
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          padding: 10
                        }}
                      >
                        {step.step}
                      </Text>
                    </View>
                  )
                )}
                {this.state.currentUser.isAnonymous ? null : this.state
                    .added ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <View style={{ margin: 5 }}>
                      <Button
                        color="coral"
                        title="Learnt"
                        onPress={() => this.learnt(true)}
                      />
                    </View>
                  </View>
                ) : (
                  <Button
                    color="coral"
                    title="Add to Home"
                    onPress={this.addHome}
                  />
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

export default connect(mapStateToProps)(TutorialScreen);
