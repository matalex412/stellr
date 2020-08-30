import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import PropTypes from "prop-types";
import { human } from "react-native-typography";

export default class ProfileBanner extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} style={this.props.style}>
        <View style={[styles.wrapper, this.props.viewStyle]}>
          {this.props.user.profilePic ? (
            <Image
              style={[styles.profilePic, this.props.imageStyle]}
              source={{ uri: this.props.user.profilePic }}
            />
          ) : (
            <View style={[styles.profilePic, this.props.imageStyle]}>
              <Ionicons
                color="#ffb52b"
                name="md-person"
                size={this.props.size ? this.props.size : 23}
              />
            </View>
          )}
          <View style={{ alignItems: "center" }}>
            <Text
              style={[
                human.body,
                {
                  fontSize: this.props.font ? this.props.font : 20,
                  textAlign: "center",
                },
              ]}
            >
              {this.props.user.username}
            </Text>
            {this.props.bio && (
              <Text style={{ width: 140, textAlign: "center" }}>
                "{this.props.user.bio}"
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    padding: 5,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  profilePic: {
    marginRight: 10,
    height: 30,
    width: 30,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
});

ProfileBanner.propTypes = {
  user: PropTypes.object.isRequired,
};
