import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
  TouchableOpacity,
  Dimensions,
  Switch,
} from "react-native";
import { Video } from "expo-av";
import { connect } from "react-redux";
import { AdMobBanner } from "expo-ads-admob";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Firebase from "firebase";
import Modal from "react-native-modal";
import { AirbnbRating } from "react-native-ratings";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class TutorialScreen extends React.Component {
  state = {
    isLoading: true,
    posts: {},
    added: false,
    rating: 3,
    isModalVisible: false,
    learnt: false,
  };

  componentDidMount = () => {
    this.setup();
  };

  componentWillUnmount = () => {
    store.dispatch(updateTutorials({ current_key: null }));
  };

  setup = async () => {
    // get currentuser data
    const { currentUser } = firebase.auth();

    if (this.props.tutorials.current) {
      // get tutorials user has added
      var ids;
      var doc1 = await firebase
        .firestore()
        .collection("users/" + currentUser.uid + "/data")
        .doc("learning")
        .get();

      if (doc1.exists) {
        ids = Object.keys(doc1.data());
        if (ids.includes(this.props.tutorials.current_key)) {
          this.setState({ added: true });
        }
      }
      this.setState({ currentUser });
      this.setState({ isLoading: false });

      if (!currentUser.isAnonymous) {
        // update users interests
        var doc = await firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .get();
        var data = doc.data();
        var interests = data.interests;
        interests.creators = Object.values(interests.creators);
        interests.topics = Object.values(interests.topics);
        if (!interests.creators.includes(this.props.tutorials.current.uid)) {
          interests.creators.push(this.props.tutorials.current.uid);
        }
        if (!interests.topics.includes(this.props.tutorials.current.topic)) {
          interests.topics.push(this.props.tutorials.current.topic);
        }
        interests.topics.splice(0, interests.topics.length - 10);
        interests.creators.splice(0, interests.topics.length - 10);

        firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .update({
            interests: interests,
          });
      }
    }
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
          [this.props.tutorials.current_key]: {
            topic: this.props.tutorials.tutorial_topic,
            title: this.props.tutorials.current.title,
            thumbnail: this.props.tutorials.current.thumbnail,
          },
        },
        { merge: true }
      );

    Alert.alert("Added", "This tutorial has been added to your home");
    this.setState({ added: true });
  };

  learnt = async () => {
    const { currentUser } = firebase.auth();

    // remove post from learning object for user
    var postRef = firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("learning");
    postRef.update({
      [this.props.tutorials
        .current_key]: Firebase.firestore.FieldValue.delete(),
    });

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
        if (key == this.props.tutorials.current_key) {
          var alreadyLearnt = true;
          var data = learnt[key];
        }
      }
    }

    if (alreadyLearnt == true) {
      data.time = Date.now();
      historyRef.update({
        [this.props.tutorials.current_key]: data,
      });
    } else {
      // add to learning history
      historyRef.set(
        {
          [this.props.tutorials.current_key]: {
            topic: this.props.tutorials.tutorial_topic,
            title: this.props.tutorials.current.title,
            time: Date.now(),
          },
        },
        { merge: true }
      );
    }

    this.props.navigation.navigate("Search");
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  render() {
    var width = Dimensions.get("window").width;
    this.vids = [];
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
            <ActivityIndicator color="#fff" size="large" />
          ) : !this.props.tutorials.current ? (
            <Text>
              Sorry, this tutorial doesn't seem to exist. It may have been moved
              or deleted
            </Text>
          ) : (
            <View>
              <View style={{ margin: 10, flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/2933794374"
                  onDidFailToReceiveAdWithError={() =>
                    console.log("banner ad not loading")
                  }
                  servePersonalizedAds
                />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    paddingTop: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 20,
                      fontStyle: "italic",
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
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          padding: 20,
                        }}
                      >
                        {step.step}
                      </Text>
                    </View>
                  )
                )}
                {this.state.currentUser.isAnonymous ? null : this.state
                    .added ? (
                  <View>
                    <TouchableOpacity
                      style={{ marginBottom: 30 }}
                      onPress={() => this.setState({ isModalVisible: true })}
                    >
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 2,
                          padding: 7,
                          backgroundColor: "black",
                          flexDirection: "row",
                          flexWrap: "wrap",
                        }}
                      >
                        <Ionicons name="md-school" size={25} color="#ffb52b" />
                        <Text style={{ marginLeft: 5, color: "#ffb52b" }}>
                          Learnt
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <Modal isVisible={this.state.isModalVisible}>
                      <TouchableOpacity
                        style={[styles.button, styles.corner]}
                        onPress={() => this.setState({ isModalVisible: false })}
                      >
                        <Ionicons name="md-close" size={20} color="white" />
                      </TouchableOpacity>
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View
                          style={{ alignItems: "center", flexDirection: "row" }}
                        >
                          <Text
                            style={{
                              paddingTop: 5,
                              color: "white",
                              paddingBottom: 5,
                            }}
                          >
                            Rating:{" "}
                          </Text>
                          <AirbnbRating
                            onFinishRating={(rating) =>
                              this.setState({ rating })
                            }
                            selectedColor="#ffb52b"
                            showRating={false}
                            type="custom"
                            size={20}
                          />
                        </View>
                        <View
                          style={{ alignItems: "center", flexDirection: "row" }}
                        >
                          <Text style={{ color: "white" }}>
                            Were you able to learn the skill?
                          </Text>
                          <Switch
                            trackColor={{ false: "#767577", true: "#ffb52b" }}
                            thumbColor="#ffb52b"
                            onValueChange={(status) =>
                              this.setState({ learnt: status })
                            }
                            value={this.state.learnt}
                          />
                        </View>
                        <TouchableOpacity
                          style={{ marginBottom: 30 }}
                          onPress={this.learnt}
                        >
                          <View
                            style={{
                              justifyContent: "center",
                              alignItems: "center",
                              flexDirection: "row",
                              backgroundColor: "black",
                              padding: 7,
                              borderRadius: 2,
                            }}
                          >
                            <Ionicons
                              name="md-checkmark"
                              size={25}
                              color="#ffb52b"
                            />
                            <Text style={{ marginLeft: 5, color: "#ffb52b" }}>
                              Finish
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </Modal>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ marginBottom: 30 }}
                    onPress={this.addHome}
                  >
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                        backgroundColor: "black",
                        padding: 7,
                        borderRadius: 2,
                      }}
                    >
                      <Ionicons name="md-bookmark" size={25} color="#ffb52b" />
                      <Text style={{ marginLeft: 5, color: "#ffb52b" }}>
                        Add to Home
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text color="#6da9c9">
                    Learns: {this.props.tutorials.current.learns}
                  </Text>
                  <AirbnbRating
                    isDisabled
                    defaultRating={
                      this.props.tutorials.current.stars /
                      this.props.tutorials.current.learns
                    }
                    selectedColor="#ffb52b"
                    showRating={false}
                    type="custom"
                    size={20}
                  />
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
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(TutorialScreen);
