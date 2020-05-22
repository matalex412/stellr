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
    keys: [],
    topics: [],
    isLoading: true,
    new: "",
    current_topic: []
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // page items loading
    this.setState({ isLoading: true });

    const current_topic = this.state.current_topic;
    var topics = await firebase
      .database()
      .ref("categories")
      .once("value");
    topics = topics.toJSON();
    var step;
    for (step of current_topic) {
      topics = topics[step];
    }
    await this.setState({ topics: topics });
    await this.setState({ keys: Object.keys(this.state.topics) });
    this.setState({ isLoading: false });
  };

  addFolder = async () => {
    var topic_route = this.state.current_topic;
    var route;
    var topic = "";
    for (route in topic_route) {
      topic = topic + "/" + route;
    }

    await firebase
      .database()
      .ref("categories/" + topic)
      .update({
        [this.state.new]: ""
      });
    this.setState({ new: "" });
    this.setup();
  };

  handlePress = async topic => {
    var old_topics = this.state.topics;
    var new_topics = old_topics[topic];

    if (new_topics == "") {
      await store.dispatch(
        updateTutorials({ create_topic: [...this.state.current_topic, topic] })
      );
      this.props.navigation.navigate("Create");
    } else {
      await this.setState({
        current_topic: [...this.state.current_topic, topic]
      });
      this.setup();
    }
  };

  pickTopic = async () => {
    await store.dispatch(
      updateTutorials({ create_topic: [...this.state.current_topic] })
    );
    this.props.navigation.navigate("Create");
  };

  goBack = async () => {
    var current_topic = this.state.current_topic;

    if (current_topic.length < 1) {
      this.props.navigation.navigate("Create");
    } else {
      current_topic.pop();
      this.setState({ current_topic });
      this.setup();
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={{ fontSize: 18, color: "white" }}>
            Search Posted Tutorials
          </Text>
          {this.state.isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              {this.state.keys.map((topic, index) => {
                return (
                  <View style={{ padding: 10 }} key={index}>
                    <TouchableOpacity onPress={() => this.handlePress(topic)}>
                      <View>
                        <Text style={styles.text}>{topic}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                {this.state.current_topic.length < 1 ? null : (
                  <TouchableOpacity onPress={() => this.pickTopic()}>
                    <View>
                      <Text style={{ color: "cornflowerblue" }}>
                        Select Current Topic
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <View style={styles.line} />
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <TouchableOpacity onPress={() => this.goBack()}>
                    <View>
                      <Text style={{ color: "cornflowerblue" }}>Go back</Text>
                    </View>
                  </TouchableOpacity>
                  <TextInput
                    value={this.state.new}
                    placeholder="Enter New Group Name"
                    onChangeText={value => this.setState({ new: value })}
                    style={{ padding: 10, fontSize: 15 }}
                  />
                  <TouchableOpacity onPress={this.addFolder}>
                    <View>
                      <Text style={styles.text}>Add New Group</Text>
                    </View>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: "#fff"
  },
  text: {
    color: "black"
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#fff"
  },
  line: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    margin: 10,
    width: 200
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(SearchScreen);
