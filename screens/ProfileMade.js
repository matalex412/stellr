import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AdMobBanner } from "expo-ads-admob";

import Background from "./components/Background";
import CustomLoading from "./components/CustomLoading";
import TutorialCover from "./components/TutorialCover";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class ProfileMade extends React.Component {
  state = {
    isLoading: true,
    keys: [],
    postrefs: [],
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    var id = this.props.tutorials.profile.uid;
    var doc = await firebase
      .firestore()
      .collection(`users/${id}/data`)
      .doc("made")
      .get();
    if (doc.exists) {
      var postrefs = doc.data();
      this.setState({ keys: Object.keys(postrefs) });
      this.setState({ postrefs });
    }
    this.setState({ isLoading: false });
  };

  handlePress = async (key) => {
    // get post data
    var doc = await firebase
      .firestore()
      .collection(`${this.state.postrefs[key].topic}/posts`)
      .doc(key)
      .get();

    // send user to tutorial screen
    await store.dispatch(
      updateTutorials({ tutorial_topic: this.state.postrefs[key].topic })
    );
    await store.dispatch(updateTutorials({ current: doc.data() }));
    await store.dispatch(updateTutorials({ current_key: key }));
    this.props.navigation.navigate("Tutorial");
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Background />
          {this.state.isLoading ? (
            <CustomLoading verse="Love is patient, love is kind" />
          ) : (
            <View>
              {this.state.keys.length < 1 && (
                <Text style={{ padding: 20, fontSize: 20, color: "white" }}>
                  {this.props.tutorials.profile.username} hasn't made any
                  tutorials yet
                </Text>
              )}
              {this.state.keys.map((key, index) => {
                return (
                  <TutorialCover
                    key={index}
                    tutorial={this.state.postrefs[key]}
                    onPress={() => this.handlePress(key)}
                  />
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
  heading: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(ProfileMade);
