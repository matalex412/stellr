import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AdMobBanner } from "expo-ads-admob";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class AskScreen extends React.Component {
  state = {
    requests: {},
    request: "",
  };

  componentDidMount = () => {
    this.setup();
  };

  componentWillUnmount = () => {
    // turn off request listener
    var askRef = this.state.askRef;
    try {
      askRef.off("value");
    } catch (err) {
      console.log(err);
    }
  };

  setup = async () => {
    // get requests for tutorials
    var askRef = await firebase
      .database()
      .ref("requests")
      .on("value", async (snapshot) => {
        var requests = snapshot.val();

        if (requests != null) {
          this.setState({ requests });
        }
      });

    // store request listener
    await this.setState({ askRef });
  };

  addRequest = async () => {
    // check request is valid
    var request = this.state.request;
    if (request.length == 0) {
      this.setState({ errorMessage: "Invalid Request" });
    } else if (Object.keys(this.state.requests).includes(request)) {
      this.setState({
        errorMessage: "Someone's already asked for this tutorial",
      });
    } else {
      await firebase
        .database()
        .ref("requests")
        .update({
          [request]: "unmade",
        });

      this.setState({ request: "" });
      this.setState({ errorMessage: null });
    }
  };

  tutorial = async (request) => {
    // get post data
    var doc = await firebase
      .firestore()
      .collection(`${request.topic}/posts`)
      .doc(request.postid)
      .get();

    // send user to tutorial screen
    await store.dispatch(updateTutorials({ tutorial_topic: request.topic }));
    await store.dispatch(updateTutorials({ current: doc.data() }));
    await store.dispatch(updateTutorials({ current_key: request.postid }));
    this.props.navigation.navigate("Tutorial");
  };

  makePost = async (title) => {
    // create new tutorial with current topic
    await store.dispatch(updateTutorials({ title: title }));
    await store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
    await store.dispatch(updateTutorials({ create_topic: [] }));
    await store.dispatch(updateTutorials({ create_topic_string: null }));
    await store.dispatch(updateTutorials({ request: title }));

    this.props.navigation.navigate("Create");
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <AdMobBanner
            adUnitID="ca-app-pub-3262091936426324/7558442816"
            onDidFailToReceiveAdWithError={() =>
              console.log("banner ad not loading")
            }
            servePersonalizedAds
          />
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
          <Text style={styles.heading}>Requested Tutorials</Text>
          <View
            style={{
              backgroundColor: "#6da9c9",
              margin: 5,
              padding: 5,
              borderRadius: 5,
              alignItems: "flex-start",
            }}
          >
            {Object.keys(this.state.requests).map((request, index) => (
              <View key={index}>
                {this.state.requests[request] == "unmade" ? (
                  <TouchableOpacity
                    onPress={() => this.makePost(request)}
                    style={{ alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 18, color: "white" }}>
                      {request}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 18, color: "white" }}>
                      {request} -{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        this.tutorial(this.state.requests[request])
                      }
                    >
                      <Text style={{ color: "#ffb52b", fontSize: 18 }}>
                        Tutorial made
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
          {this.state.errorMessage && (
            <Text style={{ color: "#6da9c9" }}>{this.state.errorMessage}</Text>
          )}
          <View
            style={{
              backgroundColor: "black",
              borderRadius: 2,
              padding: 3,
              margin: 10,
              alignItems: "center",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <TextInput
              value={this.state.request}
              placeholder="Ask for a tutorial"
              onChangeText={(value) => this.setState({ request: value })}
              style={{
                borderWidth: 1,
                padding: 5,
                borderColor: "white",
                color: "white",
                fontSize: 15,
                margin: 5,
              }}
            />
            <TouchableOpacity style={{ margin: 5 }} onPress={this.addRequest}>
              <Ionicons name="md-send" size={20} color="#ffb52b" />
            </TouchableOpacity>
          </View>
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
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(AskScreen);
