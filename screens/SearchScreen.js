import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  BackHandler,
  Alert,
  Dimensions
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class SearchScreen extends React.Component {
  state = {
    isLoading: true
  };

  backAction = () => {
    if (this.props.tutorials.current_topic.length > 0) {
      this.goBack();
      return true;
    } else {
      return false;
    }
  };

  componentDidMount = () => {
    this.backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this.backAction
    );

    this.setup();
  };

  componentWillUnmount() {
    this.backHandler.remove();
  }

  setup = async () => {
    // page items loading
    this.setState({ isLoading: true });

    // refresh items
    this.setState({ errorMessage: null });

    // get current topic folder and dictionary of all existing topic folders
    const current_topic = this.props.tutorials.current_topic;
    var topics = await firebase
      .database()
      .ref("categories")
      .once("value");
    topics = topics.toJSON();

    // store the subtopics of the current topic folder
    var step;
    for (step of current_topic) {
      topics = topics[step];
    }

    // removes icon key
    if (topics["icon"] != null) {
      delete topics.icon;
    }

    await this.setState({ topics });
    await this.setState({ topicnames: Object.keys(topics) });

    // create string showing route to current topic folder
    var route;
    var topic = "";
    for (route of current_topic) {
      topic = topic + "/" + route;
    }
    await store.dispatch(updateTutorials({ tutorial_topic: topic }));

    // find posts in topic folder
    var contents = await firebase
      .database()
      .ref("posts" + topic)
      .once("value");
    contents = contents.toJSON();
    var keys = [];
    var postids = [];
    var key;
    if (contents != null) {
      keys = Object.keys(contents);
      for (key of keys) {
        if (key[0] == "-") {
          postids.push(key);
        }
      }
      await this.setState({ contents });
    }
    await this.setState({ postids });

    // page finished loading
    this.setState({ isLoading: false });
  };

  clickedTopic = async topic => {
    // update topic
    await store.dispatch(
      updateTutorials({
        current_topic: [...this.props.tutorials.current_topic, topic]
      })
    );

    // setup page with new items
    this.setup();
  };

  handlePress = async postid => {
    // store clicked post and go to tutorial page
    await store.dispatch(updateTutorials({ current_key: postid }));
    await store.dispatch(
      updateTutorials({ current: this.state.contents[postid] })
    );
    this.props.navigation.navigate("Tutorial");
  };

  goBack = async () => {
    // go back one topic layer
    var current_topic = this.props.tutorials.current_topic;
    current_topic.pop();
    await store.dispatch(updateTutorials({ current_topic }));
    this.setup();
  };

  noPosts = async () => {
    // create new tutorial with current topic
    store.dispatch(updateTutorials({ title: "" }));
    store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
    await store.dispatch(
      updateTutorials({ create_topic: this.props.tutorials.current_topic })
    );

    var current_topic = this.props.tutorials.create_topic;
    var i;
    if (current_topic.length > 0) {
      var topic = current_topic[0];
      for (i = 1; i < current_topic.length; i++) {
        topic = topic + " > " + current_topic[i];
      }
    } else {
      var topic = null;
    }
    await store.dispatch(updateTutorials({ create_topic_string: topic }));

    this.props.navigation.navigate("Create");
  };

  addFolder = () => {
    var topic_route = this.props.tutorials.current_topic;
    var route;
    var topic = "";
    for (route of topic_route) {
      topic = topic + "/" + route;
    }

    firebase
      .database()
      .ref("categories" + topic)
      .update({
        icon: this.state.new
      });
    this.setState({ new: "" });
  };

  render() {
    var postids = this.state.postids;
    var topics = this.state.topicnames;
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
          {this.state.isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View>
              {topics.length < 1 ? null : (
                <View>
                  <Text style={styles.heading}>Topics</Text>
                  <View
                    style={{
                      justifyContent: "center",
                      flexDirection: "row",
                      flexWrap: "wrap"
                    }}
                  >
                    {topics.map((topic, index) => {
                      return (
                        <TouchableOpacity
                          style={styles.square}
                          key={index}
                          onPress={() => this.clickedTopic(topic)}
                        >
                          <MaterialCommunityIcons
                            name={this.state.topics[topic].icon}
                            size={40}
                            color="#0b5c87"
                          />
                          <View>
                            <Text style={styles.text}>{topic}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
              {postids.length < 1 ? (
                this.props.tutorials.current_topic.length < 1 ? null : (
                  <View style={{ alignItems: "center" }}>
                    <Text style={styles.heading}>Posts</Text>
                    <TouchableOpacity onPress={() => this.noPosts()}>
                      <Text style={{ fontSize: 18, color: "white" }}>
                        None made yet, be the first
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.centerview}>
                  <Text style={styles.heading}>Posts</Text>
                  {postids.map((postid, index) => {
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => this.handlePress(postid)}
                      >
                        <View
                          style={{
                            padding: 5,
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "center"
                          }}
                        >
                          <Image
                            resizeMode={"cover"}
                            style={{ width: "100%", height: 200 }}
                            source={{
                              uri: this.state.contents[postid].thumbnail
                            }}
                          />
                          <View style={{ margin: 10, alignSelf: "center" }}>
                            <Text style={{ color: "white", fontSize: 20 }}>
                              {this.state.contents[postid].title}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
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
  square: {
    margin: 10,
    width: Dimensions.get("window").width / 3 - 30,
    height: Dimensions.get("window").width / 3 - 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 10,
    backgroundColor: "white"
  },
  text: {
    textAlign: "center",
    color: "#0b5c87",
    fontSize: 15
  },
  heading: {
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
    padding: 2,
    alignSelf: "center"
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "center",
    width: "100%"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(SearchScreen);
