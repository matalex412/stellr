import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import { connect } from "react-redux";
import { AdMobBanner, AdMobInterstitial } from "expo-ads-admob";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import Firebase from "firebase";
import { AirbnbRating } from "react-native-ratings";
import Modal from "react-native-modal";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { human, systemWeights } from "react-native-typography";

import ProfileBanner from "./components/ProfileBanner";
import ModalAlert from "./components/ModalAlert";
import CustomLoading from "./components/CustomLoading";
import LearnModal from "./components/LearnModal";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class TutorialScreen extends React.Component {
  state = {
    isModalVisible: false,
    isLoading: true,
    posts: {},
    added: false,
    paid: false,
    activeIndex: 0,
    minas: 0,
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

    var doc = await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.current.uid)
      .get();
    var data = doc.data();
    var creatorProfile = {
      profilePic: data.profilePic,
      username: data.username,
    };
    this.setState({ creatorProfile });

    if (this.props.tutorials.current) {
      this.setState({ currentUser });
      this.setState({ isLoading: false });

      // Display an interstitial
      await AdMobInterstitial.setAdUnitID(
        "ca-app-pub-3800661518525298/2568980529"
      );
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      AdMobInterstitial.showAdAsync();
    }
  };

  learnt = async (rating, complete) => {
    const { currentUser } = await firebase.auth();
    var alreadyLearnt = false;

    // update user's history
    if (!currentUser.isAnonymous) {
      // get users history
      var doc = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("history")
        .get();

      var historyRef = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("history");

      // check if tutorial has previously been learnt by user
      if (doc.exists) {
        var learnt = doc.data();
        var key;
        var keys = Object.keys(learnt);
        for (key of keys) {
          if (key == this.props.tutorials.current_key) {
            var alreadyLearnt = true;
            var data = learnt[key];
          }
        }
      }

      if (alreadyLearnt == true) {
        var newRating = rating;
        // calculate overall rating change
        if (data.rating) {
          rating -= data.rating;
        }
        // store if learnt or not
        if (data.complete) {
          var oldField = "learns";
        } else {
          var oldField = "incomplete";
        }
        // update tutorial stats
        await firebase
          .firestore()
          .collection(`${this.props.tutorials.current.topic}/posts`)
          .doc(this.props.tutorials.current_key)
          .update({
            [oldField]: Firebase.firestore.FieldValue.increment(-1),
          });

        // update history if previously learnt
        data.time = Date.now();
        data.complete = complete;
        data.rating = newRating;
        historyRef.update({
          [this.props.tutorials.current_key]: data,
        });
      } else {
        // add to learning history
        historyRef.set(
          {
            [this.props.tutorials.current_key]: {
              topic: this.props.tutorials.current.topic,
              title: this.props.tutorials.current.title,
              thumbnail: this.props.tutorials.current.thumbnail,
              time: Date.now(),
              complete: complete,
              rating: rating,
            },
          },
          { merge: true }
        );
      }
    }

    // store if learnt or not
    if (complete) {
      var field = "learns";
    } else {
      var field = "incomplete";
    }

    if (!currentUser.isAnonymous && !alreadyLearnt) {
      // update current user stats for adding review
      await firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid)
        .update({
          stars: Firebase.firestore.FieldValue.increment(1),
          weeklyStars: Firebase.firestore.FieldValue.increment(1),
        });
    }

    // update tutorial stats
    await firebase
      .firestore()
      .collection(`${this.props.tutorials.current.topic}/posts`)
      .doc(this.props.tutorials.current_key)
      .update({
        stars: Firebase.firestore.FieldValue.increment(rating),
        [field]: Firebase.firestore.FieldValue.increment(1),
      });

    // update creator's weekly stars
    await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.current.uid)
      .update({
        stars: Firebase.firestore.FieldValue.increment(rating),
        weeklyStars: Firebase.firestore.FieldValue.increment(rating),
      });
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  changeModalVisibility = (visible) => {
    this.setState({ isModalVisible: visible });
  };

  blockUser = async () => {
    const { currentUser } = await firebase.auth();

    var doc = await firebase
      .firestore()
      .collection("users")
      .doc(currentUser.uid)
      .get();
    var userData = doc.data();
    if (userData.blocked) {
      var blocked = userData.blocked;
    } else {
      var blocked = [];
    }

    blocked.push(this.props.tutorials.current.uid);

    await firebase.firestore().collection("users").doc(currentUser.uid).update({
      blocked: blocked,
    });

    this.props.navigation.navigate("Search");
  };

  reportPost = () => {
    firebase
      .firestore()
      .collection(this.props.tutorials.current.topic)
      .doc(this.props.tutorials.current_key)
      .update({
        reports: Firebase.firestore.FieldValue.increment(1),
      });
  };

  _renderItem = ({ item, index }) => {
    var width = Dimensions.get("window").width;
    return (
      <View key={index} style={{ paddingVertical: 10 }}>
        {item.Images && (
          <Image
            source={{ uri: item.Images }}
            style={{
              marginBottom: 10,
              width: width,
              height: 300,
            }}
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
            color: "#2274A5",
            fontSize: 16,
            textAlign: "center",
            paddingHorizontal: 10,
          }}
        >
          {item.step}
        </Text>
      </View>
    );
  };

  render() {
    var rating = (
      this.props.tutorials.current.stars /
      (this.props.tutorials.current.learns +
        this.props.tutorials.current.incomplete)
    ).toFixed(1);
    if (rating == "NaN") {
      rating = 0;
    }
    this.vids = [];
    var width = Dimensions.get("window").width;
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ModalAlert
          title={this.state.alertTitle}
          message={this.state.alertMessage}
          isModalVisible={this.state.isModalVisible}
          onDismiss={() => this.changeModalVisibility(false)}
          icon={this.state.alertIcon}
        />
        {this.state.isLoading ? (
          <CustomLoading verse="Do you see a man skilled in his work? He will stand before kings" />
        ) : !this.props.tutorials.current ? (
          <Text>
            Sorry, this tutorial doesn't seem to exist. It may have been moved
            or deleted
          </Text>
        ) : (
          <View style={{ width: "100%", height: "100%" }}>
            <View style={{ minHeight: 50, alignItems: "center" }}>
              <AdMobBanner
                adUnitID="ca-app-pub-3800661518525298/6229842172"
                onDidFailToReceiveAdWithError={() =>
                  console.log("banner ad not loading")
                }
                servePersonalizedAds
              />
            </View>
            <View
              style={{
                width: "100%",
                padding: 10,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={styles.title}>
                {this.props.tutorials.current.title}
              </Text>
              <View style={{ alignItems: "center" }}>
                <View style={styles.pagination}>
                  <Text style={{ color: "#fff" }}>
                    {this.state.activeIndex + 1}/
                    {this.props.tutorials.current.steps.length}
                  </Text>
                </View>
                <Carousel
                  layout={"default"}
                  ref={(ref) => (this.carousel = ref)}
                  data={this.props.tutorials.current.steps}
                  sliderWidth={width}
                  itemWidth={width}
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
                    borderTopWidth: 1,
                    borderBottomWidth:
                      this.props.tutorials.current.topic == "/topics/Meta"
                        ? 1
                        : 0,
                    borderColor: "lightgray",
                    width: width,
                    justifyContent: "space-evenly",
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="md-eye"
                      size={25}
                      color="#2274A5"
                      style={{ marginRight: 3 }}
                    />
                    <Text>
                      {this.props.tutorials.current.learns +
                        this.props.tutorials.current.incomplete}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="md-star"
                      size={25}
                      color="#2274A5"
                      style={{ marginRight: 3 }}
                    />
                    <Text>{rating}</Text>
                  </View>
                  <TouchableOpacity onPress={this.reportPost}>
                    <Ionicons
                      name="md-flag"
                      size={25}
                      color="#2274A5"
                      style={{ marginRight: 3 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.blockUser}>
                    <Ionicons
                      name="md-flag"
                      size={25}
                      color="#2274A5"
                      style={{ marginRight: 3 }}
                    />
                  </TouchableOpacity>
                  <LearnModal learnt={this.learnt} />
                </View>
                {!(this.props.tutorials.current.topic == "/topics/Meta") && (
                  <ProfileBanner
                    imageStyle={{
                      width: 40,
                      height: 40,
                    }}
                    font={22}
                    user={this.state.creatorProfile}
                    viewStyle={{
                      borderWidth: 1,
                      borderColor: "lightgray",
                      width: width,
                      justifyContent: "center",
                    }}
                    size={32}
                  />
                )}
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
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    ...human.headlineObject,
    ...systemWeights.semibold,
    color: "#2274A5",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    ...human.title2Object,
    ...systemWeights.light,
    fontStyle: "italic",
    color: "#2274A5",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#2274A5",
    elevation: 1,
    padding: 7,
    borderRadius: 2,
  },
  pagination: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 20,
    padding: 3,
    backgroundColor: "#2275A5",
    zIndex: 999,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(TutorialScreen);
