import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";

import CustomLoading from "./components/CustomLoading";
import { updateTutorials } from "./../redux/actions";
import { store } from "./../redux/store";
import { firebase } from "./../src/config";

class MessageScreen extends React.Component {
  state = {
    messages: {},
    isLoading: true,
  };

  componentDidMount = () => {
    this.getMessages();
  };

  componentWillUnmount = () => {
    this.read();

    // remove firebase listener
    var messageRef = this.state.messageRef;
    if (messageRef) {
      messageRef();
    }
  };

  read = async () => {
    // change status of all messages to "read"
    var time;
    var data = this.state.data;
    for (time of Object.keys(data)) {
      if (data[time].status != "read") {
        data[time].status = "read";
      }
    }

    // update database
    const { currentUser } = firebase.auth();
    firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("messages")
      .update(data);
  };

  timeDifference(current, previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
      return Math.round(elapsed / 1000) + " seconds ago";
    } else if (elapsed < msPerHour) {
      return Math.round(elapsed / msPerMinute) + " minutes ago";
    } else if (elapsed < msPerDay) {
      return Math.round(elapsed / msPerHour) + " hours ago";
    } else if (elapsed < msPerMonth) {
      return Math.round(elapsed / msPerDay) + " days ago";
    } else if (elapsed < msPerYear) {
      return Math.round(elapsed / msPerMonth) + " months ago";
    } else {
      return Math.round(elapsed / msPerYear) + " years ago";
    }
  }

  getMessages = async () => {
    const { currentUser } = firebase.auth();

    // get user's messages
    var doc = await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("messages")
      .get();

    this.setState({ isLoading: true });
    // check if user has messages
    if (doc.exists) {
      // store messages in state
      if (doc.data()) {
        this.setState({ data: doc.data() });
        var keys = Object.keys(doc.data());
        var d,
          time,
          times = [];

        // sort messages chronologically
        keys.sort(function(a, b) {
          return a - b;
        });
        this.setState({ keys });

        // calculate time ago from now
        for (time of keys) {
          time = Number(time);
          d = new Date(time);
          var timeAgo = this.timeDifference(Date.now(), d);
          times.push(timeAgo);
        }
        this.setState({ times });
      } else {
        alert("Sorry, you aren't connected to internet. Don't Panic");
      }
    }

    this.setState({ isLoading: false });

    // update messagebox status
    await store.dispatch(updateTutorials({ unread: false }));
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <CustomLoading verse="Your word is a lamp to my feet and a light to my path" />
          ) : this.state.times.length == 0 ? (
            <Text style={{ color: "#2274A5" }}>No Messages</Text>
          ) : (
            <View style={styles.messageList}>
              {this.state.keys.map((time, index) => {
                return (
                  <View style={styles.message} key={index}>
                    <Text
                      style={{
                        flex: 1,
                        flexWrap: "wrap",
                        fontSize: 20,
                        color:
                          this.state.data[time].status == "unread"
                            ? "#ffb52b"
                            : "black",
                      }}
                    >
                      {this.state.data[time].message}
                    </Text>
                    <Text
                      style={{
                        textAlign: "left",
                        fontSize: 18,
                        color:
                          this.state.data[time].status == "unread"
                            ? "#ffb52b"
                            : "grey",
                      }}
                    >
                      {this.state.times[index]}
                    </Text>
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
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "white",
  },
  messageList: { width: "100%", flexDirection: "column-reverse" },
  message: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 5,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});
export default connect(mapStateToProps)(MessageScreen);
