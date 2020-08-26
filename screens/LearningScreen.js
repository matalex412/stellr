import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import { connect } from "react-redux";
import { AdMobBanner, AdMobInterstitial } from "expo-ads-admob";
import { LinearGradient } from "expo-linear-gradient";
import Firebase from "firebase";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AirbnbRating } from "react-native-ratings";

import CustomLoading from "./components/CustomLoading";
import LearnModal from "./components/LearnModal";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class LearningScreen extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    added: false,
    rating: 3,
    isModalVisible: false,
    learnt: false,
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
    var doc = await firebase
      .firestore()
      .collection(`${postInfo.topic}/posts`)
      .doc(this.props.tutorials.learn_key)
      .get();

    if (!currentUser.isAnonymous) {
      // check if user has bookmarked tutorial
      var ids;
      var doc2 = await firebase
        .firestore()
        .collection("users/" + currentUser.uid + "/data")
        .doc("learning")
        .get();

      if (doc2.exists) {
        ids = Object.keys(doc2.data());
        if (ids.includes(this.props.tutorials.learn_key)) {
          this.setState({ added: true });
        }
      }
    }
    this.setState({ currentUser });

    // check if post exists
    if (!doc.exists) {
      Alert.alert(
        "Error",
        "Sorry, this tutorial has either been deleted or its topic has been changed"
      );

      if (this.state.added) {
        // remove post from learning object for user
        var postRef = firebase
          .firestore()
          .collection(`users/${currentUser.uid}/data`)
          .doc("learning");
        postRef.update({
          [this.props.tutorials
            .learn_key]: Firebase.firestore.FieldValue.delete(),
        });
      }

      this.props.navigation.navigate("Home");
    } else {
      var post = doc.data();
      this.setState({ currentUser });
      this.setState({ post });
      this.setState({ isLoading: false });

      if (this.state.added) {
        // TEST THIS
        const update = {};
        update[`${this.props.tutorials.learn_key}.thumbnail`] = post.thumbnail;

        // update thumbnail if changed
        if (post.thumbnail != postInfo.thumbnail) {
          firebase
            .firestore()
            .collection(`users/${currentUser.uid}/data`)
            .doc("learning")
            .update(update);
        }
      }
    }
  };

  learnt = async (rating, complete, added) => {
    // Display an interstitial
    await AdMobInterstitial.setAdUnitID(
      "ca-app-pub-3262091936426324/1869093284"
    );
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();

    const { currentUser } = firebase.auth();

    if (added) {
      // remove post from learning object for user
      var postRef = firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("learning");
      postRef.update({
        [this.props.tutorials
          .learn_key]: Firebase.firestore.FieldValue.delete(),
      });
    }

    if (!currentUser.isAnonymous) {
      var alreadyLearnt = false;
      var historyRef = firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("history");

      // get users history
      var doc = historyRef.get();
      // check if tutorial has previously been learnt by user
      if (doc.exists) {
        var learnt = doc.data();
        var keys = Object.keys(learnt);
        for (key of keys) {
          if (key == this.props.tutorials.learn_key) {
            var alreadyLearnt = true;
            var data = learnt[key];
          }
        }
      }

      if (alreadyLearnt == true) {
        data.time = Date.now();
        data.complete = complete;
        historyRef.update({
          [this.props.tutorials.learn_key]: data,
        });
      } else {
        // add to learning history
        historyRef.set(
          {
            [this.props.tutorials.learn_key]: {
              topic: this.props.tutorials.added.topic,
              title: this.state.post.title,
              thumbnail: this.props.tutorials.added.thumbnail,
              time: Date.now(),
              complete: complete,
            },
          },
          { merge: true }
        );
      }
    }

    if (complete) {
      var field = "learns";
    } else {
      var field = "incomplete";
    }

    // update tutorial stats
    await firebase
      .firestore()
      .collection(`${this.props.tutorials.added.topic}/posts`)
      .doc(this.props.tutorials.learn_key)
      .update({
        stars: Firebase.firestore.FieldValue.increment(rating),
        [field]: Firebase.firestore.FieldValue.increment(1),
      });

    // update creator's weekly stars
    await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.added.uid)
      .update({
        weeklyStars: Firebase.firestore.FieldValue.increment(rating),
      });

    this.setState({ isModalVisible: false });
    this.props.navigation.navigate("Home");
  };

  addHome = async () => {
    const { currentUser } = await firebase.auth();

    // add tutorial to user's learning section
    await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("learning")
      .set(
        {
          [this.props.tutorials.learn_key]: {
            topic: this.props.tutorials.added.topic,
            title: this.state.post.title,
            thumbnail: this.props.tutorials.added.thumbnail,
          },
        },
        { merge: true }
      );

    Alert.alert("Added", "This tutorial has been added to your home");
    this.setState({ added: true });
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  render() {
    var width = Dimensions.get("window").width;
    return (
      <View style={styles.container}>
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
            <CustomLoading verse="Do you see a man skilled in his work? He will stand before kings" />
          ) : (
            <View>
              <View style={{ flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/2933794374"
                  onDidFailToReceiveAdWithError={() =>
                    console.log("banner ad not loading")
                  }
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
                      fontStyle: "italic",
                    }}
                  >
                    {this.state.post.title}
                  </Text>
                  <Text style={{ color: "white" }}>
                    by {this.state.post.username}
                  </Text>
                </View>
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text
                    style={{ marginBottom: 5, fontSize: 18, color: "#fff" }}
                  >
                    Learns:{" "}
                    {this.state.post.learns - this.state.post.incomplete}
                  </Text>
                  <AirbnbRating
                    isDisabled
                    defaultRating={
                      this.state.post.stars /
                      (this.state.post.learns + this.state.post.incomplete)
                    }
                    selectedColor="#ffb52b"
                    showRating={false}
                    type="custom"
                    size={20}
                  />
                </View>
                {Object.values(this.state.post.steps).map((step, index) => (
                  <View
                    style={{
                      borderRadius: 5,
                      backgroundColor: "#6da9c9",
                      width: width - 100,
                      marginTop: 25,
                      marginBottom: 25,
                      alignItems: "center",
                      padding: 5,
                    }}
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
                        onPlaybackStatusUpdate={(playbackStatus) =>
                          this._onPlaybackStatusUpdate(playbackStatus, index)
                        }
                        ref={(component) => (this.vids[index] = component)}
                        source={{ uri: step.Videos }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={false}
                        resizeMode={Video.RESIZE_MODE_CONTAIN}
                        useNativeControls
                        style={{ margin: 10, width: 200, height: 200 }}
                      />
                    )}
                    <Text style={{ padding: 20, color: "white", fontSize: 16 }}>
                      {step.step}
                    </Text>
                  </View>
                ))}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {this.state.currentUser.isAnonymous ? null : this.state
                      .added ? null : (
                    <TouchableOpacity
                      style={{ marginBottom: 30 }}
                      onPress={this.addHome}
                    >
                      <View style={[styles.bookmark, { marginRight: 10 }]}>
                        <Ionicons
                          name="md-bookmark"
                          size={25}
                          color="#ffb52b"
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                  <LearnModal added={this.state.added} learnt={this.learnt} />
                </View>
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
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 16,
    color: "white",
  },
  corner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    margin: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#000",
    borderRadius: 40,
    margin: 5,
  },
  bookmark: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "black",
    padding: 7,
    borderRadius: 2,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LearningScreen);
