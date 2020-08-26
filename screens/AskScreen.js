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
import Modal from "react-native-modal";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class AskScreen extends React.Component {
  state = {
    requests: {},
    request: "",
    isModalVisible: false,
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
      <View style={{ padding: 5 }}>
        <TouchableOpacity
          onPress={() => this.setState({ isModalVisible: true })}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <MaterialCommunityIcons
              name="android-messages"
              size={35}
              color="white"
            />
            <Text style={{ marginLeft: 5, color: "white", fontSize: 15 }}>
              Tutorial Requests
            </Text>
          </View>
        </TouchableOpacity>
        <Modal isVisible={this.state.isModalVisible}>
          <TouchableOpacity
            onPress={() => this.setState({ isModalVisible: false })}
          >
            <Ionicons name="md-close" size={20} color="white" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.contentContainer}>
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
              <Text style={{ color: "#6da9c9" }}>
                {this.state.errorMessage}
              </Text>
            )}
            <View
              style={{
                backgroundColor: "#6da9c9",
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
                placeholder="Enter Tutorial you'd like"
                onChangeText={(value) => this.setState({ request: value })}
                style={{
                  padding: 5,
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
        </Modal>
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
