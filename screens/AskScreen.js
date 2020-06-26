import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class AskScreen extends React.Component {
  state = {
    requests: {},
    request: ""
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    await firebase
      .database()
      .ref("requests")
      .on("value", async snapshot => {
        var requests = snapshot.val();

        if (requests != null) {
          this.setState({ requests });
        }
      });
  };

  addRequest = async () => {
    // check request is valid
    var request = this.state.request;
    if (request.length == 0) {
      this.setState({ errorMessage: "Invalid Topic Name" });
    } else if (Object.keys(this.state.requests).includes(request)) {
      this.setState({ errorMessage: "Topic already exists" });
    } else {
      await firebase
        .database()
        .ref("requests")
        .update({
          [request]: "unmade"
        });

      this.setState({ request: "" });
      this.setup();
    }
  };

  tutorial = async request => {
    var post = await firebase
      .database()
      .ref(`posts${request.topic}/${request.postid}`)
      .once("value");
    post = post.toJSON();

    await store.dispatch(updateTutorials({ current: post }));
    await store.dispatch(updateTutorials({ current_key: request.postid }))

    this.props.navigation.navigate("Tutorial");
  };

  makePost = async title => {
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
          <Text style={styles.heading}>Requested Tutorials</Text>
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
                    onPress={() => this.tutorial(this.state.requests[request])}
                  >
                    <Text style={{ color: "coral", fontSize: 18 }}>
                      Tutorial made
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <View style={styles.line} />
          {this.state.errorMessage && (
            <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
          )}
          <TextInput
            value={this.state.request}
            placeholder="Tutorial Request"
            onChangeText={value => this.setState({ request: value })}
            style={{ color: "white", padding: 5, fontSize: 15 }}
          />
          <TouchableOpacity onPress={this.addRequest}>
            <View>
              <Text style={{ color: "white" }}>Ask for tutorial</Text>
            </View>
          </TouchableOpacity>
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
    backgroundColor: "#fff"
  },
  heading: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold"
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "center",
    margin: 10,
    width: "70%"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(AskScreen);
