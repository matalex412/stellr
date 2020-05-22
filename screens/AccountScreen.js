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

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class AccountScreen extends React.Component {
  state = {
    errorMessage: null,
    isLoading: true
  };

  componentDidMount = () => {
    const { currentUser } = firebase.auth();
    this.setState({ currentUser });
    this.setState({ isLoading: false });
  };

  logout = async () => {
    await firebase.auth().signOut();
  };

  delete = async () => {
    var user = firebase.auth().currentUser;

    var userRef = await firebase.database().ref("users/" + currentUser.uid)
    userRef.remove()

    try {
      await user.delete();
      this.props.navigation.navigate("Auth");
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  posts = () => {
    this.props.navigation.navigate("History");
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : this.state.currentUser.isAnonymous ? (
          <View>
            <TouchableOpacity onPress={this.logout}>
              <Text style={{ padding: 10 }}>Sign up or Create an Account</Text>
            </TouchableOpacity>          
          </View>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <View style={{ alignItems: "center" }}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>
                  {this.state.currentUser.displayName}
                </Text>
                's Account
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                {this.state.currentUser.email}
              </Text>
            </View>
            <View style={{ alignItems: "center", margin: 10 }}>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("UserPosts")}>
                <Text style={{ margin: 5, color: 'cornflowerblue' }}>Your Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.props.navigation.navigate("History")}>
                <Text style={{ margin: 5, color: 'cornflowerblue' }}>Learning History</Text>
              </TouchableOpacity>
            </View>
            <Button
              color={"cornflowerblue"}
              title="Logout"
              onPress={this.logout}
            />
            {this.state.errorMessage && (
              <Text style={{ color: "coral" }}>{this.state.errorMessage}</Text>
            )}
            <TouchableOpacity onPress={this.delete}>
              <Text style={{ padding: 10, color: "coral", fontWeight: "bold" }}>
                Delete Account
              </Text>
            </TouchableOpacity>
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

export default connect(mapStateToProps)(AccountScreen);
