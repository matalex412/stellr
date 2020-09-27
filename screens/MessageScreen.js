import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";

import Background from "./components/Background";
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
        var d;
        var time,
          times = [];
        for (time of keys) {
          time = Number(time);
          d = new Date(time);
          var mins = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
          times.push(`${d.getDate()}/${d.getMonth()}  ${d.getHours()}:${mins}`);
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
          <Background />
          {this.state.isLoading ? (
            <CustomLoading verse="Your word is a lamp to my feet and a light to my path" />
          ) : this.state.times.length == 0 ? (
            <Text style={{ color: "white" }}>No Messages</Text>
          ) : (
            <View style={{ width: "100%", flexDirection: "column-reverse" }}>
              {Object.keys(this.state.data).map((time, index) => {
                return (
                  <View style={styles.message} key={index}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        textAlign: "left",
                        fontSize: 20,
                        color:
                          this.state.data[time].status == "unread"
                            ? "#ffb52b"
                            : "black",
                      }}
                    >
                      {this.state.times[index]} -
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        flexWrap: "wrap",
                        fontSize: 20,
                        marginLeft: 5,
                        color:
                          this.state.data[time].status == "unread"
                            ? "#ffb52b"
                            : "black",
                      }}
                    >
                      {this.state.data[time].message}
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
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  message: {
    padding: 5,
    marginVertical: 10,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 3,
    elevation: 2,
    flexDirection: "row",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(MessageScreen);
