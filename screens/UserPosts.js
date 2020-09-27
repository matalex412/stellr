import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";

import Background from "./components/Background";
import CustomLoading from "./components/CustomLoading";
import TutorialCover from "./components/TutorialCover";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPosts extends React.Component {
  state = {
    isLoading: true,
    postrefs: {},
    keys: [],
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    const { currentUser } = firebase.auth();

    // get reference data to user's posts
    var madeRef = await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("made")
      .onSnapshot(async (doc) => {
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

  handlePress = async (key) => {
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
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Background />
          {this.state.isLoading ? (
            <CustomLoading verse="Do you see a man skilled in his work? He will stand before kings" />
          ) : this.state.keys.length < 1 ? (
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 20 }}>
                You haven't made any yet
              </Text>
              <TouchableOpacity
                onPress={() => this.props.navigation.navigate("Create")}
              >
                <Text style={{ fontSize: 18, color: "#2274A5" }}>
                  Make one now
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            this.state.keys.map((key, index) => {
              return (
                <TutorialCover
                  key={index}
                  tutorial={this.state.postrefs[key]}
                  onPress={() => this.handlePress(key)}
                />
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
  button: {
    borderWidth: 0,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    margin: 0,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(UserPosts);
