import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPosts extends React.Component {
  state = {
    isLoading: true,
    postrefs: {},
    keys: []
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    const { currentUser } = firebase.auth();

    // get reference data to user's posts
    var madeRef = firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("made")
      .onSnapshot(async doc => {
        this.setState({ isLoading: true });
        if (doc.exists) {
          var postrefs = doc.data();
          this.setState({ keys: Object.keys(postrefs) });
          await this.setState({ postrefs });
        }
        this.setState({ isLoading: false });
      });
    this.setState({ madeRef });
  };

  handlePress = async key => {
    // get post and redirect to editing page
    var doc = await firebase
      .firestore()
      .collection(`${this.state.postrefs[key].topic}/posts`)
      .doc(key)
      .get();

    var post = doc.data();
    post.topic = this.state.postrefs[key].topic;
    post.postid = key;
    await store.dispatch(updateTutorials({ userpost: post }));
    this.props.navigation.navigate("UserTutorial");
  };

  componentWillUnmount = () => {
    var madeRef = this.state.madeRef;
    if (madeRef) {
      madeRef();
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#6da9c9", "#fff"]}
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
        ) : this.state.postrefs.length < 1 ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white" }}>You haven't made any yet</Text>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("Create")}
            >
              <Text style={{ color: "coral" }}>Make one now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          this.state.keys.map((key, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={() => this.handlePress(key)}
              >
                <View>
                  <Text style={{ color: "white", fontSize: 20 }}>
                    {this.state.postrefs[key].title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  button: {
    borderWidth: 0,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    margin: 0
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(UserPosts);
