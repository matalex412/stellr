import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

import { firebase } from "./../../src/config";
import MessageBox from "./MessageBox";

export default class AppHeader extends React.Component {

  render() {
    // check if currentUser is anonymous
    var { currentUser } = firebase.auth()
    if (currentUser != null) {
      var { isAnonymous } = currentUser
    } else {
      var isAnonymous = true
    }

    return (
      <View>
        {isAnonymous ? (
          <TouchableOpacity
            style={{ paddingRight: 10 }}
            onPress={() => {
              this.props.navigation.navigate("SignUp")
              firebase.auth().signOut()
            }}
          >
            <Text style={{ color: "white", paddingRight: 10 }}>
              Sign Up
            </Text>
          </TouchableOpacity>          
        ) : (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{ paddingRight: 10 }}
              onPress={() => {
                this.props.navigation.navigate("Messages");
              }}
            >
              <MessageBox />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingRight: 10 }}
              onPress={() => {
                this.props.navigation.navigate("Account");
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <Text style={{ color: "white", paddingRight: 5 }}>
                  Account
                </Text>
                <Ionicons
                  style={{ color: "white", paddingRight: 5 }}
                  name="md-person"
                  size={20}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}