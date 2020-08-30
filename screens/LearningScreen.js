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
import Firebase from "firebase";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AirbnbRating } from "react-native-ratings";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { human, systemWeights } from "react-native-typography";

import Background from "./components/Background";
import CustomLoading from "./components/CustomLoading";
import LearnModal from "./components/LearnModal";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class LearningScreen extends React.Component {
  state = {
    paid: false,
    isLoading: true,
    posts: {},
    activeIndex: 0,
    added: false,
    rating: 3,
    isModalVisible: false, //needed?
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

    if (!currentUser.isAnonymous) {
      var doc = await firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();
      this.setState({ minas: doc.data().minas });
    }

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

    // Display an interstitial
    await AdMobInterstitial.setAdUnitID(
      "ca-app-pub-3262091936426324/1869093284"
    );

    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
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

  /*buy = async () => {
    var { currentUser } = await firebase.auth();

    if (!currentUser.isAnonymous) {
      var userRef = firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid);

      firebase.firestore().runTransaction((transaction) => {
        return transaction.get(userRef).then((doc) => {
          var minas = doc.data().minas - 5;
          if (minas >= 0) {
            transaction.update(userRef, { minas });
            firebase
              .firestore()
              .collection("users")
              .doc(this.props.tutorials.current.uid)
              .update({
                minas: Firebase.firestore.FieldValue.increment(5),
              });
            this.setState({ paid: true });
          } else {
            Alert.alert(
              "Not Enough Minas",
              "Sorry, you don't have enough Minas right now. You can earn Minas by creating tutorials"
            );
          }
        });
      });
    } else {
      Alert.alert(
        "Not Enough Minas",
        "Sorry, you don't have enough Minas right now. You can earn Minas by creating tutorials (you need an account to do this)"
      );
    }
  };*/

  _renderItem = ({ item, index }) => {
    var width = Dimensions.get("window").width;
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            borderRadius: 5,
            backgroundColor: "#fff",
            elevation: 3,
            width: width - 100,
            marginBottom: 25,
            alignItems: "center",
            padding: 20,
          }}
          key={index}
        >
          <Text style={styles.heading}>Step {index + 1}</Text>
          {item.Images && (
            <Image
              source={{ uri: item.Images }}
              style={{ margin: 10, width: 200, height: 200, borderRadius: 1 }}
            />
          )}
          {item.Videos && (
            <Video
              onPlaybackStatusUpdate={(playbackStatus) =>
                this._onPlaybackStatusUpdate(playbackStatus, index)
              }
              ref={(component) => (this.vids[index] = component)}
              source={{ uri: item.Videos }}
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
              color: "#6da9c9",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {item.step}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    var width = Dimensions.get("window").width;
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Background />
        {this.state.isLoading ? (
          <CustomLoading verse="Do you see a man skilled in his work? He will stand before kings" />
        ) : (
          <View>
            <View style={{ alignItems: "center" }}>
              <AdMobBanner
                adUnitID="ca-app-pub-3262091936426324/2933794374"
                onDidFailToReceiveAdWithError={() =>
                  console.log("banner ad not loading")
                }
              />
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 10,
              }}
            >
              {this.state.paid ? null : (
                <View
                  style={{
                    alignItems: "center",
                    top: 5,
                    right: 20,
                    position: "absolute",
                  }}
                >
                  <MaterialCommunityIcons
                    name="sack"
                    size={30}
                    color="#ffb52b"
                  />
                  <Text
                    style={{
                      color: "white",
                      top: 10,
                      position: "absolute",
                    }}
                  >
                    {this.state.minas}
                  </Text>
                </View>
              )}

              <Text style={styles.title}>{this.state.post.title}</Text>
              <Text style={{ color: "white" }}>
                by {this.state.post.username}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  padding: 5,
                  alignItems: "center",
                }}
              >
                <Text style={[human.calloutWhite, { marginRight: 10 }]}>
                  Learns: {this.state.post.learns - this.state.post.incomplete}
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
              {this.state.post.info ? (
                <Text
                  style={[
                    human.calloutWhite,
                    {
                      marginHorizontal: 40,
                      marginVertical: 10,
                      textAlign: "center",
                    },
                  ]}
                >
                  {this.props.tutorials.current.info}
                </Text>
              ) : null}

              <View style={{ alignItems: "center" }}>
                <Pagination
                  dotsLength={this.state.post.steps.length}
                  containerStyle={{
                    paddingTop: 10,
                    paddingBottom: 15,
                  }}
                  animatedDuration={50}
                  activeDotIndex={this.state.activeIndex}
                  dotColor="#fff"
                  inactiveDotColor="dimgray"
                  dotStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: 4,
                  }}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
                <Carousel
                  layout={"default"}
                  ref={(ref) => (this.carousel = ref)}
                  data={this.state.post.steps}
                  sliderWidth={300}
                  itemWidth={300}
                  renderItem={this._renderItem}
                  onSnapToItem={(index) =>
                    this.setState({ activeIndex: index })
                  }
                  containerCustomStyle={{
                    flexGrow: 0,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 15,
                  }}
                >
                  {this.state.currentUser.isAnonymous ? null : this.state
                      .added ? null : (
                    <TouchableOpacity onPress={this.addHome}>
                      <View style={[styles.button, { marginRight: 10 }]}>
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
  },
  heading: {
    ...human.headlineObject,
    ...systemWeights.semibold,
    color: "#6da9c9",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    ...human.title2WhiteObject,
    ...systemWeights.light,
    fontStyle: "italic",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#6da9c9",
    elevation: 1,
    padding: 7,
    borderRadius: 2,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LearningScreen);
