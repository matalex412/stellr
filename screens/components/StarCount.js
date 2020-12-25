import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { connect } from "react-redux";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { human } from "react-native-typography";

import { firebase } from "./../../src/config";

class StarCount extends React.Component {
  render() {
    // check if currentUser is anonymous
    var { currentUser } = firebase.auth();
    if (currentUser != null) {
      var { isAnonymous } = currentUser;
    } else {
      var isAnonymous = true;
    }

    var stars = this.props.tutorials.stars;
    return (
      <View>
        {isAnonymous ? null : (
          <View
            style={{
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 15,
            }}
          >
            <MaterialCommunityIcons name="star" size={30} color="#ffb52b" />
            <Text style={{ fontSize: 20, color: "#fff" }}>{stars}</Text>
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(StarCount);
