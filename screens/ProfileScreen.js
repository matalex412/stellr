import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class ProfileScreen extends React.Component {
  state = {
    isLoading: true,
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    var id = this.props.tutorials.profileId;
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
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            this.state.keys.map((key, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => this.handlePress(key)}
                >
                  <View
                    style={{
                      padding: 5,
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      resizeMode={"cover"}
                      style={{
                        width: "100%",
                        height: 200,
                        marginBottom: -10,
                      }}
                      source={{
                        uri: this.state.postrefs[key].thumbnail,
                      }}
                    />
                    <View
                      style={{
                        padding: 5,
                        width: "100%",
                        backgroundColor: "white",
                        alignSelf: "center",
                      }}
                    >
                      <Text style={{ color: "#6da9c9", fontSize: 20 }}>
                        {this.state.postrefs[key].title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
    padding: 10,
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

export default connect(mapStateToProps)(ProfileScreen);
