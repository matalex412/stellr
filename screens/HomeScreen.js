import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Firebase from "firebase";
import { AdMobBanner } from "expo-ads-admob";

import ModalAlert from "./components/ModalAlert";
import CustomLoading from "./components/CustomLoading";
import { updateTutorials } from "./../redux/actions";
import { store } from "./../redux/store";
import { firebase } from "./../src/config";

class HomeScreen extends React.Component {
  state = {
    currentUser: null,
    isLoading: true,
    posts: {},
    keys: [],
    isModalVisible: false,
  };

  componentDidMount = () => {
    this.setup();
  };

  componentWillUnmount = () => {
    // turn off tutorial listener
    var learnRef = this.state.learnRef;
    if (learnRef) {
      learnRef();
    }
  };

  changeModalVisibility = (visible) => {
    this.setState({ isModalVisible: visible });
  };

  shuffle = (array) => {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  setup = async () => {
    this.setState({ isLoading: true });
    var { currentUser } = await firebase.auth();

    if (this.props.tutorials.newAccount) {
      this.setState({ alertTitle: "Welcome!" });
      this.setState({
        alertMessage: `Hi and welcome to Skoach! To get started, why not try out the "Using Skoach" tutorials on the "Added" page`,
      });
      this.changeModalVisibility(true);
      store.dispatch(updateTutorials({ newAccount: false }));
    }

    if (!currentUser) {
      // sign user in
      await firebase
        .auth()
        .signInAnonymously()
        .catch((err) => {
          console.log(err.message);
        });

      // get new currentUser info
      currentUser = await firebase.auth().currentUser;
    }

    this.getPosts();

    // check user is verified
    if (currentUser.isVerified) {
      // get user's messages
      var doc = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("messages")
        .get();
      if (doc.exists) {
        var messages = doc.data();

        if (messages["Please verify your email"]) {
          firebase
            .firestore()
            .collection(`users/${currentUser.uid}/data`)
            .doc("messages")
            .update({
              "Please verify your email": Firebase.firestore.FieldValue.delete(),
            });
        }
      }
    }
  };

  getPosts = async () => {
    this.setState({ isLoading: true });
    var { currentUser } = await firebase.auth();

    // get user's interests
    if (!currentUser.isAnonymous) {
      var doc = await firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();
      if (doc.exists) {
        var data = doc.data();
        var interests = data.interests;
      } else {
        var interests = {
          creators: ["4CRlxvD9rpZB3ASqJriEwEJbDQ92"],
          topics: ["/topics/Meta", "/topics/Art"],
        };
      }
    } else if (currentUser.isAnonymous) {
      var interests = { creators: [], topics: ["/topics/Meta", "/topics/Art"] };
    }
    // fetch tutorials related to user's interests
    var creator,
      doc,
      docs,
      post,
      posts = [];

    for (creator of interests.creators) {
      docs = await firebase
        .firestore()
        .collectionGroup("posts")
        .where("uid", "==", creator)
        .limit(5)
        .get();
      docs.forEach((doc) => {
        post = doc.data();
        post.key = doc.id;
        posts.push(post);
      });
    }

    for (var topic of interests.topics) {
      docs = await firebase
        .firestore()
        .collectionGroup("posts")
        .where("topic", "==", topic)
        .limit(5)
        .get();
      docs.forEach((doc) => {
        post = doc.data();
        post.key = doc.id;

        if (!posts.some((p) => p.key == post.key)) {
          posts.push(post);
        }
      });
    }
    posts = this.shuffle(posts);

    // split list of tutorials into rows for display
    var rows = [];
    var i,
      j,
      temparray,
      chunk = 2;
    for (i = 0, j = posts.length; i < j; i += chunk) {
      temparray = posts.slice(i, i + chunk);
      rows.push(temparray);
    }
    this.setState({ rows });
    this.setState({ isLoading: false });
  };

  handlePress = async (post) => {
    // redirect user to learning page with post info
    await store.dispatch(updateTutorials({ learn_key: post.key }));
    await store.dispatch(updateTutorials({ added: post }));
    this.props.navigation.navigate("Learning");
  };

  render() {
    var width = Dimensions.get("window").width;
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={this.getPosts} />
          }
        >
          <ModalAlert
            title={this.state.alertTitle}
            message={this.state.alertMessage}
            isModalVisible={this.state.isModalVisible}
            onDismiss={() => this.changeModalVisibility(false)}
          />
          <LinearGradient
            colors={["#fff", "#fff"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "100%",
            }}
          />
          {this.state.isLoading ? (
            <CustomLoading
              color="#6da9c9"
              verse="Do you see a man skilled in his work? He will stand before kings"
            />
          ) : (
            <View>
              <View style={{ alignItems: "center", marginBottom: 5 }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/7558442816"
                  onDidFailToReceiveAdWithError={() =>
                    console.log("banner ad not loading")
                  }
                  servePersonalizedAds
                />
              </View>
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                {this.state.rows.map((row, index) => {
                  return (
                    <View key={index} style={{ flexDirection: "row" }}>
                      {row.map((image, i) => {
                        return (
                          <TouchableOpacity
                            key={i}
                            onPress={() => this.handlePress(image)}
                            style={{ elevation: 2 }}
                          >
                            <Image
                              resizeMode={"cover"}
                              style={{
                                width: width / 2 - 28,
                                height: 200,
                                margin: 7,
                                borderRadius: 5,
                              }}
                              source={{ uri: image.thumbnail }}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
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
  button: {
    position: "absolute",
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 35,
    backgroundColor: "white",
    borderRadius: 35,
    margin: 5,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(HomeScreen);
