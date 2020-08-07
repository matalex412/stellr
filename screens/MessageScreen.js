import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

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
    var messageRef = await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("messages")
      .onSnapshot(async (doc) => {
        this.setState({ isLoading: true });
        // check if user has messages
        if (doc.exists) {
          // store messages in state
          this.setState({ data: doc.data() });
          var keys = Object.keys(doc.data());
          var d;
          var time,
            times = [];
          for (time of keys) {
            time = Number(time);
            d = new Date(time);
            var mins = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
            times.push(
              `${d.getDate()}/${d.getMonth()}  ${d.getHours()}:${mins}`
            );
          }
          this.setState({ times });
        }

        this.setState({ isLoading: false });
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
            colors={["#6da9c9", "#fff"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "100%",
            }}
          />
          {this.state.isLoading ? (
            <CustomLoading verse="Your word is a lamp to my feet and a light to my path" />
          ) : this.state.times.length == 0 ? (
            <Text style={{ color: "white" }}>No Messages</Text>
          ) : (
            Object.keys(this.state.data).map((time, index) => {
              return (
                <View style={styles.message} key={index}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginLeft: 20,
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
                      marginRight: 20,
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
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  message: {
    flexDirection: "row",
    width: "100%",
  },
  line: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "center",
    margin: 10,
    width: "70%",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(MessageScreen);
