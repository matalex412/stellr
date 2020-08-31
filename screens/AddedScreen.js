import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Firebase from "firebase";

import CustomLoading from "./components/CustomLoading";
import TutorialCover from "./components/TutorialCover";
import { updateTutorials } from "./../redux/actions";
import { store } from "./../redux/store";
import { firebase } from "./../src/config";

class HomeScreen extends React.Component {
  state = {
    currentUser: null,
    isLoading: true,
  };

  componentDidMount = () => {
    this.getPosts();
  };

  componentWillUnmount = () => {
    // turn off tutorial listener
    var learnRef = this.state.learnRef;
    if (learnRef) {
      learnRef();
    }
  };

  getPosts = async () => {
    this.setState({ isLoading: true });
    var { currentUser } = await firebase.auth();

    if (!currentUser) {
      // sign user in
      await firebase
        .auth()
        .signInAnonymously()
        .catch((err) => {
          console.log(err.message);
        });

      // get updated currentUser info
      currentUser = await firebase.auth().currentUser;
      await this.setState({ currentUser });
      await this.setState({ isLoading: false });
    } else if (!currentUser.isAnonymous) {
      // get user's added tutorials
      var learnRef = firebase
        .firestore()
        .collection("users/" + currentUser.uid + "/data")
        .doc("learning")
        .onSnapshot(async (doc) => {
          this.setState({ isLoading: true });
          var posts = doc.data();

          // check if user is learning any posts
          if (doc.exists) {
            var keys = Object.keys(posts);
          } else {
            var keys = [];
          }

          await this.setState({ posts });
          await this.setState({ keys });
          await this.setState({ currentUser });
          await this.setState({ isLoading: false });
        });

      await this.setState({ currentUser });
      await this.setState({ learnRef });
    } else {
      await this.setState({ currentUser });
      this.setState({ isLoading: false });
    }
  };

  handlePress = async (key) => {
    console.log(key);
    console.log(this.state.posts[key]);
    // redirect user to learning page with post info
    await store.dispatch(updateTutorials({ learn_key: key }));
    await store.dispatch(updateTutorials({ added: this.state.posts[key] }));
    this.props.navigation.navigate("Learning");
  };

  remove = async (key) => {
    const { currentUser } = firebase.auth();

    // remove post from learning object for user
    var postRef = firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("learning");
    postRef.update({
      [key]: Firebase.firestore.FieldValue.delete(),
    });
  };

  render() {
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
          ) : this.state.currentUser.isAnonymous ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 18, color: "#fff" }}>
                Hi, you need an account to be able to bookmark tutorials
              </Text>
            </View>
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              {this.state.keys.length < 1 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => this.props.navigation.navigate("Search")}
                  >
                    <Text style={{ fontSize: 18, color: "#fff" }}>
                      You haven't added any tutorials yet
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  {this.state.keys.map((key, index) => {
                    return (
                      <TutorialCover
                        key={index}
                        tutorial={this.state.posts[key]}
                        onPress={() => this.handlePress(key)}
                      />
                    );
                  })}
                </View>
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
