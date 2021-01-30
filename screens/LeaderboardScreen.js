import React from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { firebase } from "./../src/config";
import Ionicons from "react-native-vector-icons/Ionicons";
import { connect } from "react-redux";
import { AdMobBanner } from "expo-ads-admob";
import { human, systemWeights } from "react-native-typography";
import NetInfo from "@react-native-community/netinfo";

import NoInternet from "./components/NoInternet";
import ProfileBanner from "./components/ProfileBanner";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import CustomLoading from "./components/CustomLoading";

class LeaderboardScreen extends React.Component {
  state = {
    users: [],
    isLoading: true,
    showLeaderboard: false,
    current: {},
    isConnected: true,
  };

  componentDidMount = () => {
    this.setup();
  };

  checkConnectivity = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({ isConnected: state.isConnected });
    });
    unsubscribe();
  };

  clickedUser = async (user) => {
    await store.dispatch(updateTutorials({ profile: user }));
    this.props.navigation.navigate("Profile");
  };

  setup = async () => {
    await this.checkConnectivity();
    if (this.state.isConnected) {
      this.setState({ isLoading: true });
      var { currentUser } = await firebase.auth();

      var docs = await firebase
        .firestore()
        .collection("users")
        .orderBy("weeklyStars", "desc")
        .limit(5)
        .get();

      var user,
        users = [];
      docs.forEach((doc) => {
        user = doc.data();
        user.uid = doc.id;
        users.push(user);
      });

      // check day so leaderboard is only displayed on sunday
      var d = new Date().getDay();
      if (d == 0) {
        this.setState({ showLeaderboard: true });
      }

      if (!currentUser.isAnonymous) {
        var doc2 = await firebase
          .firestore()
          .collection("users")
          .doc(currentUser.uid)
          .get();

        var current = doc2.data();
        current.uid = doc2.id;
        this.setState({ current });
      } else {
        await this.setState({ isAnonymous: true });
      }

      this.setState({ users });
      this.setState({ isLoading: false });
    } else {
      this.setState({ isLoading: false });
    }
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {this.state.isLoading ? (
          <CustomLoading verse="I can do all things through him who strengthens me" />
        ) : (
          <View
            style={{ width: "100%", alignItems: "center", marginBottom: 20 }}
          >
            <View style={{ marginVertical: 5, alignItems: "center" }}>
              <AdMobBanner
                adUnitID="ca-app-pub-3800661518525298/6229842172"
                onDidFailToReceiveAdWithError={() =>
                  console.log("banner ad not loading")
                }
                servePersonalizedAds
              />
            </View>
            <Text
              style={[
                human.title1,
                systemWeights.bold,
                { marginTop: 5, color: "#2274A5" },
              ]}
            >
              Weekly Stars
            </Text>
            <View
              style={{
                alignItems: "flex-end",
                padding: 10,
                flexDirection: "row",
              }}
            >
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[2] ? (
                  <ProfileBanner
                    imageStyle={{ marginRight: 0, width: 50, height: 50 }}
                    viewStyle={{ flexDirection: "column" }}
                    user={this.state.users[2]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[2])}
                  />
                ) : (
                  <View style={styles.questionCircle}>
                    <Ionicons
                      color="#2274A5"
                      name="md-help-outline"
                      style={{ alignSelf: "center", marginBottom: 5 }}
                      size={50}
                    />
                  </View>
                )}
                <View style={[styles.bar, { height: 25 }]} />
              </View>
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[0] ? (
                  <ProfileBanner
                    imageStyle={{ marginRight: 0, width: 50, height: 50 }}
                    viewStyle={{ flexDirection: "column" }}
                    user={this.state.users[0]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[0])}
                  />
                ) : (
                  <View style={styles.questionCircle}>
                    <Ionicons
                      color="#2274A5"
                      name="md-help-outline"
                      style={{ alignSelf: "center", marginBottom: 5 }}
                      size={50}
                    />
                  </View>
                )}
                <View style={[styles.bar, { height: 75 }]} />
              </View>
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[1] ? (
                  <ProfileBanner
                    imageStyle={{ marginRight: 0, width: 50, height: 50 }}
                    viewStyle={{ flexDirection: "column" }}
                    user={this.state.users[1]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[1])}
                  />
                ) : (
                  <View style={styles.questionCircle}>
                    <Ionicons
                      color="#2274A5"
                      name="md-help-outline"
                      style={{ alignSelf: "center", marginBottom: 5 }}
                      size={50}
                    />
                  </View>
                )}
                <View style={[styles.bar, { height: 50 }]} />
              </View>
            </View>
            {this.state.isConnected ? (
              <View style={{ width: "100%", alignItems: "center" }}>
                {this.state.users.map((user, index) => {
                  return (
                    <View
                      key={index}
                      style={{ alignItems: "center", flexDirection: "row" }}
                    >
                      <View
                        style={[
                          styles.rank,
                          {
                            backgroundColor:
                              user.uid == this.state.current.uid
                                ? "#ffb52b"
                                : "#fff",
                          },
                        ]}
                      >
                        <Text>{index + 1}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => this.clickedUser(user)}
                        style={{
                          width: "70%",
                          marginVertical: 7,
                          padding: 8,
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexDirection: "row",
                          elevation: 5,
                          backgroundColor:
                            user.uid == this.state.current.uid
                              ? "#ffb52b"
                              : "#fff",
                          borderRadius: 40,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.5,
                          shadowRadius: 2,
                        }}
                      >
                        <ProfileBanner
                          style={styles.profile}
                          user={user}
                          onPress={() => this.clickedUser(user)}
                        />
                        <View
                          style={{ alignItems: "center", flexDirection: "row" }}
                        >
                          <Ionicons
                            name="md-star"
                            size={25}
                            style={{ margin: 3 }}
                            color={
                              user.uid == this.state.current.uid
                                ? "#000"
                                : "#ffb52b"
                            }
                          />
                          <Text style={{ fontSize: 15 }}>
                            {user.weeklyStars}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {this.state.users.some(
                  (e) => e.uid == this.state.current.uid
                ) || this.state.isAnonymous ? null : (
                  <View
                    style={{
                      margin: 20,
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "row",
                      width: "80%",
                      elevation: 1,
                      backgroundColor: "#ffb52b",
                    }}
                  >
                    <ProfileBanner
                      style={styles.profile}
                      user={this.state.current}
                    />
                    <Ionicons
                      name="md-star"
                      size={20}
                      style={{ margin: 3 }}
                      color="#000"
                    />
                    <Text style={{ fontSize: 15 }}>
                      {this.state.current.weeklyStars
                        ? this.state.current.weeklyStars
                        : 0}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <NoInternet refresh={this.setup} />
            )}
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "white",
  },
  bar: {
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    marginTop: 5,
  },
  text: {
    fontSize: 13,
    margin: 5,
    color: "white",
    alignSelf: "center",
  },
  podium: {
    margin: 5,
    flex: 1,
  },
  rank: {
    backgroundColor: "white",
    elevation: 3,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  questionCircle: {
    backgroundColor: "white",
    elevation: 3,
    borderRadius: 100,
    marginHorizontal: 25,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LeaderboardScreen);
