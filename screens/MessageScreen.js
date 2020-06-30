import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import { updateTutorials } from "./../redux/actions";
import { store } from "./../redux/store";
import { firebase } from "./../src/config";

class MessageScreen extends React.Component {
  state = {
    messages: {}
  };

  componentDidMount = () => {
    this.getMessages();
  };

  componentWillUnmount = () => {
    this.read();

    // remove firebase listener
    messageRef = this.state.messageRef;

    if (messageRef) {
      messageRef.off("value");
    }
  };

  read = async () => {
    // change status of all messages to "read"
    var messages = this.state.messages;
    for (message in messages) {
      if (messages[message] != "read") {
        messages[message] = "read";
      }
    }

    // update database
    const { currentUser } = firebase.auth();
    await firebase
      .database()
      .ref("users/" + currentUser.uid)
      .update({
        messages: messages
      });
  };

  getMessages = async () => {
    const { currentUser } = firebase.auth();

    // get current users messages
    var messageRef = await firebase
      .database()
      .ref(`users/${currentUser.uid}/messages`);
    messageRef.on("value", async snapshot => {
      var messages = snapshot.val();

      if (messages != null) {
        this.setState({ messages });
      }
    });

    // update messagebox status
    await store.dispatch(updateTutorials({ unread: false }));
    this.setState({ messageRef });
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
          {Object.keys(this.state.messages).length == 0 ? (
            <Text style={{ color: "white" }}>No Messages</Text>
          ) : (
            Object.keys(this.state.messages).map((message, index) => {
              return (
                <View style={styles.message} key={index}>
                  <Text
                    key={index}
                    style={{
                      textAlign: "center",
                      fontSize: 15,
                      color:
                        this.state.messages[message] == "unread"
                          ? "coral"
                          : "white"
                    }}
                  >
                    {message}
                  </Text>
                </View>
              );
            })
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
    backgroundColor: "#fff"
  },
  message: {
    marginLeft: 10,
    marginRight: 10
  },
  line: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "center",
    margin: 10,
    width: "70%"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(MessageScreen);
