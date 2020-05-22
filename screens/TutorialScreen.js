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
    var posts = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning")
      .once("value");
    posts = posts.toJSON();
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

    // iterate over steps and get images
    var i;
    var steps = Object.values(this.props.tutorials.current.steps);
    for (i = 0; i < steps.length; i++) {
      if (steps[i].Images != null) {
        try {
          var url = await firebase
            .storage()
            .ref()
            .child(
              `posts${this.props.tutorials.tutorial_topic}/${this.props.tutorials.current_key}/steps/${i}/Image`
            )
            .getDownloadURL();
          steps[i].Images = url;
        } catch (err) {
          Alert.alert(
            "Error",
            "The Image(s) Cannot be Displayed. If you are the creator of this tutorial, you may have to reupload it"
          );
          steps[i].Images = null;
          console.log(err);
        }
      }
      if (steps[i].Videos != null) {
        try {
          var url = await firebase
            .storage()
            .ref()
            .child(
              `posts${this.props.tutorials.tutorial_topic}/${this.props.tutorials.current_key}/steps/${i}/Video`
            )
            .getDownloadURL();
          steps[i].Videos = url;
        } catch (err) {
          Alert.alert(
            "Error",
            "The Video(s) Cannot be Displayed. If you are the creator of this tutorial, it may have to be reuploaded"
          );
          console.log(err);
        }
      }
    }

    this.setState({ currentUser })
    this.setState({ isLoading: false });
  };

  addHome = async () => {
    const { currentUser } = firebase.auth();

    await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning")
      .push({
        postid: this.props.tutorials.current_key,
        topic: this.props.tutorials.tutorial_topic,
        title: this.props.tutorials.current.title
      });

    Alert.alert("Added", "This tutorial has been added to your home");
    this.setState({ added: true });
  };

  learnt = async (userLearnt) => {
    const { currentUser } = firebase.auth()
    
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
        refKey = postkey
      }
    }

    var postRef = firebase.database().ref("users/" + currentUser.uid + "/learning/" + refKey)
    postRef.remove()

    if (userLearnt) {
      // add to learning history
      await firebase.database().ref("users/" + currentUser.uid + "/history").push({
        title: this.props.tutorials.current.title
      })
    }

    this.props.navigation.navigate('Search')
  }

  bannerError = () => {
    console.log('banner ad not loading')
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={{ alignItems: "center", padding: 10 }}>
              <AdMobBanner style={styles.bannerAd}
                bannerSize="fullBanner"
                adUnitID="ca-app-pub-3940256099942544/6300978111"
                onDidFailToReceiveAdWithError={this.bannerError}
              />
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20, fontStyle: "italic" }}>
                  {this.props.tutorials.current.title}
                </Text>
                <Text>by {this.props.tutorials.current.username}</Text>
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
                        source={{ uri: step.Videos }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={false}
                        resizeMode="cover"
                        useNativeControls
                        style={{ margin: 10, width: 200, height: 200 }}
                      />
                    )}
                    <Text style={{ color: "cornflowerblue", fontSize: 16 }}>
                      {step.step}
                    </Text>
                  </View>
                )
              )}
              {this.state.currentUser.isAnonymous ? null : (
                this.state.added ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <View style={{ margin: 5 }}>
                      <Button
                        color="cornflowerblue"
                        title="Finish"
                        onPress={() => this.learnt(true)}
                      />
                    </View>
                    <View style={{ margin: 5 }}>
                      <Button
                        color="coral"
                        title="Remove"
                        onPress={() => this.learnt(false)}
                      />
                    </View>
                  </View>
                ) : (
                  <Button
                    color="coral"
                    title="Add to Home"
                    onPress={this.addHome}
                  />
                )
              )}
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
    padding: 10,
    backgroundColor: "#fff"
  },
  heading: {
    fontSize: 16
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(TutorialScreen);
