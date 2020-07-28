import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class PeopleScreen extends React.Component {
  state = {
    users: [],
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    var docs = await firebase
      .firestore()
      .collection("users")
      .limit(10)
      .get();

    var user,
      users = [];
    docs.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
      users.push(user);
    });

    this.setState({ users });
  };

  clickedUser = async (id) => {
    await store.dispatch(updateTutorials({ profileId: id }));
    this.props.navigation.navigate("Profile");
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
          <Text style={styles.heading}>Users</Text>
          {this.state.users.map((user, index) => {
            return (
              <TouchableOpacity
                onPress={() => this.clickedUser(user.uid)}
                key={index}
              >
                <Text style={{ fontSize: 20 }}>{user.username}</Text>
              </TouchableOpacity>
            );
          })}
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

export default connect(mapStateToProps)(PeopleScreen);
