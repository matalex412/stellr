import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import { createMaterialTopTabNavigator } from "react-navigation-tabs";
import { createAppContainer } from "react-navigation";

import ProfileHome from "./ProfileHome";
import ProfileMade from "./ProfileMade";
import ProfileBanner from "./components/ProfileBanner";
import { firebase } from "./../src/config";

const ProfileTabs = createMaterialTopTabNavigator(
  {
    Home: ProfileHome,
    Tutorials: ProfileMade,
  },
  {
    tabBarOptions: {
      activeTintColor: "#ffb52b",
      inactiveTintColor: "white",
      style: {
        backgroundColor: "#6da9c9",
      },
      indicatorStyle: {
        backgroundColor: "#ffb52b",
      },
    },
  }
);

const ProfileNav = createAppContainer(ProfileTabs);

class ProfileScreen extends React.Component {
  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // get friends data from firestore
    var { currentUser } = await firebase.auth();
    var doc = await firebase
      .firestore()
      .collection("users")
      .doc(this.props.tutorials.profile.uid)
      .get();
    var data = doc.data();

    // check if friends data has changed
    if (data.profilePic != this.props.tutorials.profile.profilePic) {
      var update = { ...this.props.tutorials.profile };
      update.profilePic = data.profilePic;

      delete update["uid"];
      await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("people")
        .update({
          [this.props.tutorials.profile.uid]: update,
        });

      update.uid = this.props.tutorials.profile.uid;
      await store.dispatch(updateTutorials({ profile: update }));
    }
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
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
        <ProfileBanner
          style={{ alignSelf: "center", margin: 10 }}
          user={this.props.tutorials.profile}
        />
        <ProfileNav />
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(ProfileScreen);
