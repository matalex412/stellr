import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { human } from "react-native-typography";
import NetInfo from "@react-native-community/netinfo";

import NoInternet from "./components/NoInternet";
import { shuffle } from "./../shuffle";
import CustomLoading from "./components/CustomLoading";
import ProfileBanner from "./components/ProfileBanner";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class PeopleScreen extends React.Component {
  state = {
    toAddLoading: true,
    isLoading: true,
    toAdd: [],
    following: [],
    friends: [],
    carouselItems: ["toAdd", "following", "friends"],
    activeIndex: 0,
    isConnected: true,
  };

  componentDidMount = () => {
    var { currentUser } = firebase.auth();
    this.setState({ currentUser });
    this.setup();
  };

  checkConnectivity = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({ isConnected: state.isConnected });
    });
    unsubscribe();
  };

  setup = async () => {
    await this.checkConnectivity();

    if (this.state.isConnected) {
      // get users already added by currentUser
      var { currentUser } = firebase.auth();
      var doc2 = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("people")
        .get();
      var people = doc2.data();

      // separate currentUser's added profiles into friends and following
      var i,
        person,
        friends = [],
        following = [];

      for (i in people) {
        person = people[i];
        person.uid = i;

        if (person.status == "friend") {
          friends.push(person);
        } else {
          following.push(person);
        }
      }

      this.setState({ friends });
      this.setState({ following });
      this.setState({ isLoading: false });

      this.getOtherUsers(9);
    } else {
      this.setState({ isLoading: false });
    }
  };

  getOtherUsers = async (n) => {
    this.setState({ toAddLoading: true });
    // get users for currentUser to add
    var { currentUser } = firebase.auth();
    if (this.state.last) {
      var docs = await firebase
        .firestore()
        .collection("users")
        .orderBy("username")
        .startAfter(this.state.last)
        .limit(n)
        .get();
    } else {
      var docs = await firebase
        .firestore()
        .collection("users")
        .orderBy("username")
        .limit(n)
        .get();
    }

    // format users
    var user,
      users = [];
    docs.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
      users.push(user);
    });

    var last = docs.docs[docs.docs.length - 1];

    // remove users already added by user and user's own profile
    var i;
    var people = this.state.following.concat(this.state.friends);

    for (i = 0; i < users.length; i++) {
      user = users[i];
      if (
        Object.keys(people).includes(user.uid) ||
        user.uid == currentUser.uid
      ) {
        users.splice(i, 1);
        i--;
      }
    }

    var toAdd = this.state.toAdd.concat(users);
    await this.setState({ toAdd });

    // rerun setup till 10 new users to add
    await this.setState({ last });
    if (toAdd.length < 9) {
      this.getOtherUsers(9 - this.state.toAdd.length);
    } else {
      await this.setState({ toAdd: shuffle(toAdd) });
      this.setState({ toAddLoading: false });
    }
  };

  clickedUser = async (user) => {
    await store.dispatch(updateTutorials({ profile: user }));
    this.props.navigation.navigate("Profile");
  };

  follow = async (user) => {
    var toAdd = this.state.toAdd;
    for (var i = 0; i < toAdd.length; i++) {
      var person = toAdd[i];
      if (person.uid == user.uid) {
        toAdd[i].added = true;
        this.setState({ toAdd: toAdd });
      }
    }

    this.setState({ searched: false });
    this.setState({ result: null });
    var friend,
      { currentUser } = firebase.auth();

    // get the array of users the to-be-added user follows
    var toaddRef = await firebase
      .firestore()
      .collection(`users/${user.uid}/data`)
      .doc("people");
    var doc = await toaddRef.get();
    if (doc.exists) {
      var otherUserFollowing = doc.data();
      if (Object.keys(otherUserFollowing).includes(currentUser.uid)) {
        friend = true;
        toaddRef.update({
          [currentUser.uid]: {
            username: currentUser.displayName,
            profilePic: currentUser.photoURL,
            status: "friend",
          },
        });
      }
    }

    // update user's linked people in firestore
    if (!user.profilePic) {
      user.profilePic = null;
    }
    await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("people")
      .set(
        {
          [user.uid]: {
            username: user.username,
            profilePic: user.profilePic,
            status: friend ? "friend" : "following",
          },
        },
        { merge: true }
      );

    if (friend) {
      var friends = this.state.friends;
      friends.push(user);
      this.setState({ friends });
    } else {
      var following = this.state.following;
      following.push(user);
      this.setState({ following });
    }
  };

  search = async () => {
    if (this.state.usernameQuery) {
      var { currentUser } = firebase.auth();

      var lowercaseQuery = this.state.usernameQuery.toLowerCase().trim();
      var doc = await firebase
        .firestore()
        .collection("users")
        .where("lowercaseName", "==", lowercaseQuery)
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const user = querySnapshot.docs[0].data();
            if (
              this.state.following.some((e) => e.username == user.username) ||
              this.state.friends.some((e) => e.username == user.username) ||
              user.username == currentUser.displayName
            ) {
              user.added = true;
            }

            user.uid = querySnapshot.docs[0].id;
            this.setState({ result: user });
          } else {
            this.setState({ result: null });
          }
        });

      this.setState({ searched: true });
    } else {
      this.setState({ searched: false });
    }
  };

  refresh = async () => {
    await this.checkConnectivity();
    if (this.state.isConnected) {
      this.getOtherUsers(9);
    } else {
      this.setState({ isLoading: false });
    }
  };

  _renderItem = ({ item, index }) => {
    return (
      <ScrollView
        contentContainerStyle={{
          marginTop: 5,
          padding: 5,
          paddingBottom: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={this.refresh} />
        }
      >
        {item == "toAdd" ? (
          <Text style={[human.title2White, styles.heading]}>
            Future friends?
          </Text>
        ) : (
          <Text style={[human.title2White, styles.heading]}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Text>
        )}
        {item == "toAdd" && this.state.toAddLoading ? (
          <ActivityIndicator
            style={{ margin: 5 }}
            color="#2274A5"
            size="large"
          />
        ) : this.state[item].length > 0 ? (
          <View
            style={{
              paddingTop: 10,
              justifyContent: "center",
              flexDirection: "row",
              flexWrap: "wrap",
              paddingBottom: 20,
            }}
          >
            {this.state[item].map((user, i) => {
              return (
                <View
                  key={i}
                  style={{
                    justifyContent: "center",
                    backgroundColor: "white",
                    elevation: 5,
                    borderRadius: 20,
                    margin: 5,
                    paddingVertical: 5,
                    width: 85,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 2,
                  }}
                >
                  <ProfileBanner
                    imageStyle={{
                      marginBottom: 5,
                      marginRight: 0,
                      width: 33,
                      height: 33,
                    }}
                    font={15}
                    viewStyle={{ flexDirection: "column" }}
                    user={user}
                    size={28}
                    onPress={() => this.clickedUser(user)}
                  />
                  {user.added ? (
                    item != "toAdd" ? null : (
                      <View
                        style={{
                          alignSelf: "center",
                        }}
                      >
                        <Ionicons
                          color="#ffb52b"
                          name="md-checkmark"
                          size={35}
                        />
                      </View>
                    )
                  ) : this.state.currentUser.isAnonymous ||
                    item != "toAdd" ? null : (
                    <TouchableOpacity
                      onPress={() => this.follow(user)}
                      style={{
                        alignSelf: "center",
                      }}
                    >
                      <Ionicons
                        color="#2274A5"
                        name="md-add-circle"
                        size={35}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text
            style={[
              human.title2,
              { color: "#2274A5", textAlign: "center", padding: 20 },
            ]}
          >
            None Made Yet...
          </Text>
        )}
      </ScrollView>
    );
  };

  render() {
    var width = Dimensions.get("window").width;

    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <View style={styles.contentContainer}>
            <CustomLoading verse="Therefore encourage one another and build one another up" />
          </View>
        ) : this.state.isConnected ? (
          <View
            style={[
              styles.contentContainer,
              { paddingTop: 20, paddingBottom: 10 },
            ]}
          >
            <View style={{ alignItems: "center", flexDirection: "row" }}>
              <TextInput
                value={this.state.usernameQuery}
                placeholder="Your friend's username"
                onChangeText={(query) => {
                  this.setState({ searched: false });
                  this.setState({ usernameQuery: query });
                }}
                style={{
                  elevation: 3,
                  borderRadius: 5,
                  color: "black",
                  padding: 5,
                  backgroundColor: "white",
                  width: 200,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 2,
                }}
              />
              <TouchableOpacity style={{ padding: 5 }} onPress={this.search}>
                <Ionicons color="#2274A5" name="md-search" size={30} />
              </TouchableOpacity>
            </View>
            {!this.state.searched ? (
              <View style={{ height: 30 }} />
            ) : !this.state.result ? (
              <View
                style={{
                  borderRadius: 5,
                  color: "black",
                  padding: 5,
                  backgroundColor: "white",
                  width: 200,
                  marginRight: 32,
                }}
              >
                <Text>No results</Text>
              </View>
            ) : (
              <View
                style={{
                  borderRadius: 5,
                  color: "black",
                  padding: 5,
                  backgroundColor: "white",
                  width: width / 30 - 10,
                  marginRight: 32,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ProfileBanner
                  user={this.state.result}
                  onPress={() => this.clickedUser(this.state.result)}
                />
                {this.state.result.added ||
                this.state.currentUser.isAnonymous ? null : (
                  <TouchableOpacity
                    onPress={() => this.follow(this.state.result)}
                  >
                    <Ionicons color="#ffb52b" name="md-add-circle" size={30} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Pagination
              dotsLength={3}
              containerStyle={{
                paddingBottom: 0,
                paddingTop: 10,
                marginBottom: 10,
              }}
              animatedDuration={50}
              activeDotIndex={this.state.activeIndex}
              dotColor="#2274A5"
              inactiveDotColor="dimgray"
              dotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginHorizontal: 4,
              }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
            <Carousel
              layout={"default"}
              ref={(ref) => (this.carousel = ref)}
              data={this.state.carouselItems}
              sliderWidth={width}
              itemWidth={width}
              renderItem={this._renderItem}
              onSnapToItem={(index) => this.setState({ activeIndex: index })}
            />
          </View>
        ) : (
          <NoInternet refresh={this.setup} />
        )}
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
    color: "#2274A5",
    fontSize: 22,
    alignSelf: "center",
  },
  profile: {
    alignItems: "flex-start",
    width: 200,
    marginRight: 10,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(PeopleScreen);
