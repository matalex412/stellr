import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel from "react-native-snap-carousel";
import { human } from "react-native-typography";

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
  };

  componentDidMount = () => {
    var { currentUser } = firebase.auth();
    this.setState({ currentUser });
    this.setup(10);
  };

  setup = async (n) => {
    // get users for currentUser to add
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
    var d,
      user,
      users = [];
    docs.forEach((doc) => {
      d = doc;
      user = doc.data();
      user.uid = doc.id;
      users.push(user);
    });

    // get users already added by currentUser
    var people = {};
    var { currentUser } = firebase.auth();
    var doc2 = await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc("people")
      .get();
    this.setState({ toAddLoading: true });

    // remove users already added by user and user's own profile
    if (doc2.exists) {
      var i,
        people = doc2.data();

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
    }

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

    var toAdd = this.state.toAdd.concat(users);
    await this.setState({ toAdd });

    // rerun setup till 10 new users to add
    if (this.state.toAdd.length < 10) {
      await this.setState({ last: d });
      this.setup(10 - this.state.toAdd.length);
    } else {
      await this.setState({ toAdd: this.shuffle(toAdd) });
      this.setState({ last: null });
      this.setState({ toAddLoading: false });
    }
  };

  shuffle = (array) => {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
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

    var added = this.state.added;
    if (friend) {
      added.friends.push(user);
    } else {
      added.following.push(user);
    }
    this.setState({ added });
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
              this.state.added.following.some(
                (e) => e.username == user.username
              ) ||
              this.state.added.friends.some(
                (e) => e.username == user.username
              ) ||
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

  _renderItem = ({ item, index }) => {
    return (
      <ScrollView style={{ marginTop: 10 }}>
        {item == "toAdd" ? (
          <Text style={[human.title2, styles.heading]}>Future friends?</Text>
        ) : (
          <Text style={styles.heading}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Text>
        )}
        {item == "toAdd" && this.state.toAddLoading ? (
          <ActivityIndicator style={{ margin: 5 }} color="#000" size="large" />
        ) : this.state[item].length > 0 ? (
          this.state[item].map((user, i) => {
            return (
              <View
                key={i}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                <ProfileBanner
                  style={styles.profile}
                  user={user}
                  onPress={() => this.clickedUser(user)}
                />
                {user.added ? (
                  <View
                    style={{
                      backgroundColor: "grey",
                      borderRadius: 20,
                      padding: 5,
                      alignSelf: "center",
                    }}
                  >
                    <Text>Added</Text>
                  </View>
                ) : this.state.currentUser.isAnonymous ||
                  item != "toAdd" ? null : (
                  <TouchableOpacity
                    onPress={() => this.follow(user)}
                    style={{
                      backgroundColor: "#ffb52b",
                      borderRadius: 20,
                      padding: 5,
                      alignSelf: "center",
                    }}
                  >
                    <Text style={human.subhead}>Add User</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={[human.body, { textAlign: "center", padding: 20 }]}>
            None Made Yet...
          </Text>
        )}
      </ScrollView>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <View style={styles.contentContainer}>
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
            <CustomLoading verse="Therefore encourage one another and build one another up" />
          </View>
        ) : (
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
            <View style={{ alignItems: "center", flexDirection: "row" }}>
              <TextInput
                value={this.state.usernameQuery}
                placeholder="Your friends username"
                onChangeText={(query) => {
                  this.setState({ searched: false });
                  this.setState({ usernameQuery: query });
                }}
                style={{
                  borderRadius: 5,
                  color: "black",
                  padding: 5,
                  backgroundColor: "white",
                  width: 200,
                }}
              />
              <TouchableOpacity style={{ padding: 5 }} onPress={this.search}>
                <Ionicons color="#ffb52b" name="md-search" size={30} />
              </TouchableOpacity>
            </View>
            {!this.state.searched ? null : !this.state.result ? (
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
                  width: 200,
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
            <Carousel
              layout={"default"}
              ref={(ref) => (this.carousel = ref)}
              data={this.state.carouselItems}
              sliderWidth={300}
              itemWidth={300}
              renderItem={this._renderItem}
              onSnapToItem={(index) => this.setState({ activeIndex: index })}
            />
            {/*<Text style={styles.heading}>New Users</Text>*/}
            {/*this.state.toAddLoading ? (
              <ActivityIndicator
                style={{ margin: 5 }}
                color="#000"
                size="large"
              />
            ) : (
              this.state.toAdd.map((user, index) => {
                return (
                  <View
                    key={index}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    <ProfileBanner
                      style={styles.profile}
                      user={user}
                      onPress={() => this.clickedUser(user)}
                    />
                    {user.added ? (
                      <View
                        style={{
                          backgroundColor: "grey",
                          borderRadius: 20,
                          padding: 5,
                          alignSelf: "center",
                        }}
                      >
                        <Text>Added</Text>
                      </View>
                    ) : this.state.currentUser.isAnonymous ? null : (
                      <TouchableOpacity
                        onPress={() => this.follow(user)}
                        style={{
                          backgroundColor: "#ffb52b",
                          borderRadius: 20,
                          padding: 5,
                          alignSelf: "center",
                        }}
                      >
                        <Text>Add User</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )*/}
            {/*!(this.state.added.friends.length > 0) ? null : (
              <View>
                <Text style={styles.heading}>Friends</Text>
                {this.state.added.friends.map((user, index) => {
                  return (
                    <View key={index}>
                      <ProfileBanner
                        style={styles.profile}
                        user={user}
                        onPress={() => this.clickedUser(user)}
                      />
                    </View>
                  );
                })}
              </View>
            )}
            {!(this.state.added.following.length > 0) ? null : (
              <View style={{ width: "100%" }}>
                <Text style={styles.heading}>Following</Text>
                {this.state.added.following.map((user, index) => {
                  return (
                    <View
                      key={index}
                      style={{
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <ProfileBanner
                        style={styles.profile}
                        user={user}
                        onPress={() => this.clickedUser(user)}
                      />
                    </View>
                  );
                })}
              </View>
            )*/}
          </ScrollView>
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
    padding: 10,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    alignSelf: "center",
    marginTop: 20,
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
