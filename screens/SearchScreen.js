import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class SearchScreen extends React.Component {
  state = {
    isLoading: true
  };

  componentDidMount = () => {
    this.setup();
  };

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

  addFolder = async () => {
    // get topic so far
    var topic_route = this.props.tutorials.current_topic;
    var route;
    var topic = "";
    for (route of topic_route) {
      topic = topic + "/" + route;
    }

    // format new topic
    var new_topic = this.state.new[0].toUpperCase() + this.state.new.slice(1);

    // get existing topics
    var old_topics = await firebase
      .database()
      .ref("categories")
      .once("value");
    old_topics = old_topics.toJSON();
    if (old_topics != null) {
      old_topics = Object.keys(old_topics);
    }

    // check if new_topic already exists
    if (old_topics.includes(new_topic)) {
      this.setState({ errorMessage: "Topic already exists" });
    } else if (new_topic == "Undefined") {
      this.setState({ errorMessage: "Invalid Topic Name" });
    } else {
      await firebase
        .database()
        .ref("categories/" + topic)
        .update({
          [new_topic]: ""
        });
      this.setup();
    }

    this.setState({ new: "" });
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
    await store.dispatch(updateTutorials({ current_key: postid }));
    await store.dispatch(
      updateTutorials({ current: this.state.contents[postid] })
    );
    this.props.navigation.navigate("Tutorial");
  };

  goBack = async () => {
    var current_topic = this.props.tutorials.current_topic;
    current_topic.pop();
    await store.dispatch(updateTutorials({ current_topic }));
    this.setup();
  };

  noPosts = async () => {
    // create new tutorial with current topic
    store.dispatch(updateTutorials({ title: "" }));
    store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
    store.dispatch(updateTutorials({ create_topic: [] }));
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

  render() {
    var postids = this.state.postids;
    var topics = this.state.topicnames;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              {topics.length < 1 ? null : (
                <View style={styles.centerview}>
                  <Text style={styles.heading}>Topics</Text>
                  {topics.map((topic, index) => {
                    return (
                      <View style={{ padding: 10 }} key={index}>
                        <TouchableOpacity
                          onPress={() => this.clickedTopic(topic)}
                        >
                          <View>
                            <Text style={styles.text}>{topic}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  <View style={styles.line} />
                </View>
              )}
              {postids.length < 1 ? (
                this.props.tutorials.current_topic.length < 1 ? null : (
                  <View style={styles.centerview}>
                    <Text style={styles.heading}>Posts</Text>
                    <TouchableOpacity
                      style={{ margin: 10 }}
                      onPress={() => this.noPosts()}
                    >
                      <Text style={{ color: "cornflowerblue" }}>
                        None made yet, be the first
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.line} />
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
                        style={{ padding: 5 }}
                      >
                        <View>
                          <Text>{this.state.contents[postid].title}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.line} />
                </View>
              )}
              {this.props.tutorials.current_topic.length < 1 ? null : (
                <TouchableOpacity onPress={() => this.goBack()}>
                  <View>
                    <Text style={{ color: "cornflowerblue" }}>Go back</Text>
                  </View>
                </TouchableOpacity>
              )}
              {this.state.errorMessage && (
                <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
              )}
              <TextInput
                value={this.state.new}
                placeholder="Enter Group Name"
                onChangeText={value => this.setState({ new: value })}
                style={{ padding: 10, fontSize: 15 }}
              />
              <TouchableOpacity onPress={this.addFolder}>
                <View>
                  <Text style={styles.text}>Add New Group</Text>
                </View>
              </TouchableOpacity>
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
    padding: 10,
    backgroundColor: "#fff"
  },
  text: {
    color: "black"
  },
  heading: {
    fontSize: 15,
    color: "black",
    fontWeight: "bold"
  },
  line: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    margin: 10,
    width: 200
  },
  centerview: {
    justifyContent: "center",
    alignItems: "center"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(SearchScreen);
