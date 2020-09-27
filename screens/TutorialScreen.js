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

import ModalAlert from "./components/ModalAlert";
import Background from "./components/Background";
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

    if (!currentUser.isAnonymous) {
      var doc = await firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();
      this.setState({ minas: doc.data().minas });
    }

    if (this.props.tutorials.current) {
      if (this.props.tutorials.current.topic == "/topics/Meta") {
        this.setState({ paid: true });
      }

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
          this.setState({ paid: true });
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
          if (interests.creators.length > 5) {
            interests.creators.shift();
          }
        }
        if (!interests.topics.includes(this.props.tutorials.current.topic)) {
          interests.topics.push(this.props.tutorials.current.topic);
          if (interests.topics.length > 5) {
            interests.topics.shift();
          }
        }

        firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .update({
            interests: interests,
          });
      }

      // Display an interstitial
      await AdMobInterstitial.setAdUnitID(
        "ca-app-pub-3262091936426324/1869093284"
      );

      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
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
            topic: this.props.tutorials.current.topic,
            title: this.props.tutorials.current.title,
            thumbnail: this.props.tutorials.current.thumbnail,
          },
        },
        { merge: true }
      );

    // redirect user
    this.setState({ alertIcon: "md-add-circle" });
    this.setState({ alertTitle: "Added" });
    this.setState({
      alertMessage: `The tutorial "${this.props.tutorials.current.title}" has been added to your home page`,
    });
    this.setState({ isModalVisible: true });
  };

  learnt = async (rating, complete, added) => {
    const { currentUser } = firebase.auth();

    if (added) {
      // remove post from learning object for user
      var postRef = firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("learning");
      postRef.update({
        [this.props.tutorials
          .current_key]: Firebase.firestore.FieldValue.delete(),
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
          if (key == this.props.tutorials.current_key) {
            var alreadyLearnt = true;
            var data = learnt[key];
          }
        }
      }

      if (alreadyLearnt == true) {
        data.time = Date.now();
        data.complete = complete;
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

    if (!alreadyLearnt) {
      // update tutorial stats
      await firebase
        .firestore()
        .collection(`${this.props.tutorials.current.topic}/posts`)
        .doc(this.props.tutorials.current_key)
        .update({
          stars: Firebase.firestore.FieldValue.increment(rating),
          [field]: Firebase.firestore.FieldValue.increment(1),
        });
    }

    // update creator's weekly stars
    await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.current.uid)
      .update({
        weeklyStars: Firebase.firestore.FieldValue.increment(rating),
        shekels: Firebase.firestore.FieldValue.increment(5),
      });

    this.props.navigation.navigate("Search");
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  buy = async (ad) => {
    var { currentUser } = await firebase.auth();

    if (!currentUser.isAnonymous) {
      if (ad) {
        AdMobInterstitial.showAdAsync();
        this.setState({ paid: true });

        if (currentUser.uid != this.props.tutorials.current.uid) {
          firebase
            .firestore()
            .collection("users")
            .doc(this.props.tutorials.current.uid)
            .update({
              minas: Firebase.firestore.FieldValue.increment(5),
            });
        }

        this.setState({ paid: true });
      } else {
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
              // redirect user
              this.setState({ alertIcon: "md-cash" });
              this.setState({ alertTitle: "Earn Minas" });
              this.setState({
                alertMessage:
                  "Sorry, you don't have enough Minas right now. You can earn them by creating tutorials",
              });
              this.setState({ isModalVisible: true });
            }
          });
        });
      }
    } else {
      // redirect user
      this.setState({ alertIcon: "md-add-circle" });
      this.setState({ alertTitle: "Earn Minas" });
      this.setState({
        alertMessage:
          "Sorry, you don't have enough Minas right now. You can earn them by creating tutorials (account needed)",
      });
      this.setState({ isModalVisible: true });
    }
  };

  changeModalVisibility = (visible) => {
    this.setState({ isModalVisible: visible });
  };

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
              color: "#2274A5",
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
    this.vids = [];
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Background />
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
          <View>
            <View style={{ alignItems: "center" }}>
              <AdMobBanner
                adUnitID="ca-app-pub-3262091936426324/2933794374"
                onDidFailToReceiveAdWithError={() =>
                  console.log("banner ad not loading")
                }
                servePersonalizedAds
              />
            </View>
            <View
              style={{
                padding: 10,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
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

              <Text style={styles.title}>
                {this.props.tutorials.current.title}
              </Text>
              <Text style={{ color: "white" }}>
                by {this.props.tutorials.current.username}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  padding: 5,
                  alignItems: "center",
                }}
              >
                <Text style={[human.calloutWhite, { marginRight: 10 }]}>
                  Learns:{" "}
                  {this.props.tutorials.current.learns -
                    this.props.tutorials.current.incomplete}
                </Text>
                <AirbnbRating
                  isDisabled
                  defaultRating={
                    this.props.tutorials.current.stars /
                    (this.props.tutorials.current.learns +
                      this.props.tutorials.current.incomplete)
                  }
                  selectedColor="#ffb52b"
                  showRating={false}
                  type="custom"
                  size={20}
                />
              </View>
              {this.props.tutorials.current.info ? (
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

              {!this.state.paid ? (
                <View style={{ margin: 15, flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => this.buy(false)}
                    style={[
                      styles.button,
                      { paddingVertical: 0, marginRight: 5 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cash-usd"
                      size={40}
                      color="#ffb52b"
                    />
                    <Text style={{ color: "white" }}> Use 5 Minas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.buy(true)}
                    style={[styles.button, { paddingTop: 0, paddingBottom: 0 }]}
                  >
                    <Ionicons name="md-play-circle" size={25} color="#ffb52b" />
                    <Text style={{ color: "white" }}> Play ad </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Pagination
                    dotsLength={this.props.tutorials.current.steps.length}
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
                    data={this.props.tutorials.current.steps}
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
                      marginBottom: 15,
                      flexDirection: "row",
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
              )}
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
    ...human.title2WhiteObject,
    ...systemWeights.light,
    fontStyle: "italic",
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
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(TutorialScreen);
