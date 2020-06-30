import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class HomeScreen extends React.Component {
  state = {
    currentUser: null,
    isLoading: true
  };


  componentDidMount = () => {
    this.getPosts();
  };

  componentWillUnmount = () => {
    // turn off tutorial listener if user isn't anonymous
    var learnRef = this.state.learnRef;
    if (learnRef) {
      learnRef.off("value");
    }
  };

  addCollection = async () => {
    var tutorial = await firebase.database().ref("Art/-MAVkJxm9CTEgAc3tS97").once("value")
    tutorial.steps = Object.values(tutorial.steps)

    console.log(tutorial)
/*    firebase.firestore().collection("posts").doc("Art").add({
      name: "Los Angeles",
      state: "CA",
      country: "USA"
    })*/
  }

  getPosts = async () => {
    this.setState({ isLoading: true });
    var { currentUser } = await firebase.auth();
    if (!currentUser) {
      await firebase
        .auth()
        .signInAnonymously()
        .catch(err => {
          console.log(err.message);
        });
      currentUser = await firebase.auth().currentUser;
      await this.setState({ currentUser });
      await this.setState({ isLoading: false });
    } else if (!currentUser.isAnonymous) {
      // get user's added tutorials
      var learnRef = await firebase
        .database()
        .ref("users/" + currentUser.uid + "/learning");
      await learnRef.on("value", async snapshot => {
        this.setState({ isLoading: true });
        var posts = snapshot.val();
        if (posts == null) {
          var keys = [];
        } else {
          var keys = Object.keys(posts);
        }

        await this.setState({ posts });
        await this.setState({ keys });
        await this.setState({ currentUser });
        await this.setState({ isLoading: false });
      });
      await this.setState({ learnRef });

      // check user is verified
      var user = await firebase
        .database()
        .ref("users/" + currentUser.uid)
        .once("value");
      if (user.verified == "false") {
        currentUser.sendEmailVerification();
        alert(
          "Your account hasn't been verified yet so we've sent you an email verification link"
        );
        firebase
          .database()
          .ref("users/" + currentUser.uid)
          .update({ verified: "pending" });
      }
    } else {
      await this.setState({ currentUser });
      this.setState({ isLoading: false });
    }
  };

  handlePress = async key => {
    await store.dispatch(updateTutorials({ learn_key: key }));
    await store.dispatch(updateTutorials({ added: this.state.posts[key] }));
    this.props.navigation.navigate("Added");
  };

  remove = async key => {
    const { currentUser } = firebase.auth();

    var postRef = await firebase
      .database()
      .ref("users/" + currentUser.uid + "/learning/" + key);
    postRef.remove();
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
          <TouchableOpacity onPress={this.addCollection}><Text>Add</Text></TouchableOpacity>
          <Text
            style={{
              fontFamily: "serif",
              margin: 10,
              fontSize: 25,
              fontStyle: "italic",
              color: "white"
            }}
          >
            'an expert in anything was once a beginner'
          </Text>
          {this.state.isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : this.state.currentUser.isAnonymous ? null : this.state.posts ==
            null ? null : (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              {this.state.keys.map((key, index) => {
                return (
                  <View key={index} style={{ marginBottom: 5 }}>
                    <TouchableOpacity onPress={() => this.handlePress(key)}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        <Image
                          resizeMode={"cover"}
                          style={{ width: "100%", height: 200 }}
                          source={{ uri: this.state.posts[key].thumbnail }}
                        />
                        <TouchableOpacity
                          style={styles.button}
                          onPress={() => this.remove(key)}
                        >
                          <Ionicons name="md-close" size={35} color="#0b5c87" />
                        </TouchableOpacity>
                        <Text
                          style={{
                            marginLeft: 10,
                            color: "white",
                            fontSize: 20,
                            margin: 5
                          }}
                        >
                          {this.state.posts[key].title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
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
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#0b5c87"
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
    margin: 5
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(HomeScreen);
