import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class HomeScreen extends React.Component {
  state = {
    currentUser: null,
    isLoading: true
  };

  componentDidMount = () => {
    this.getPosts();
  };

  getPosts = async () => {
    this.setState({ isLoading: true });
    var { currentUser } = await firebase.auth();
    if (!currentUser) {
      await firebase
        .auth()
        .signInAnonymously()
        .catch(err => {
          console.log(err.message);
        });
      currentUser = await firebase.auth().currentUser
      await this.setState({ currentUser });
      await this.setState({ isLoading: false });
    } else if (!currentUser.isAnonymous) {
      // get user's added tutorials
      await firebase
        .database()
        .ref("users/" + currentUser.uid + "/learning")
        .on("value", async snapshot => {
          var posts = snapshot.val()
          if (posts == null) {
            posts = [];
          } else {
            posts = Object.values(posts);
          }

          await this.setState({ posts });
          await this.setState({ currentUser });
          await this.setState({ isLoading: false });
        });
    } else {
      await this.setState({ currentUser });
      this.setState({ isLoading: false })
    }
  };

  handlePress = async post => {
    await store.dispatch(updateTutorials({ added: post }));
    this.props.navigation.navigate("Added");
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : this.state.currentUser.isAnonymous ? (
          <Text style={{ fontSize: 20 }}>Welcome to Skoach</Text>
        ) :
        this.state.posts.length < 1 ? (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontStyle: "italic" }}>Welcome to Skoach</Text>
            <Text style={{ fontSize: 15 }}>Tutorials you add will appear here</Text>
          </View>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "bold" }}>Continue Learning</Text>
            {this.state.posts.map((post, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => this.handlePress(post)}
                >
                  <View>
                    <Text>{post.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(HomeScreen);
