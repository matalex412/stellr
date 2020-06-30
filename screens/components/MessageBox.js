import React from "react";
import { View, Text } from "react-native";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

class MessageBox extends React.Component {
  render() {
    return (
      <View>
        {this.props.tutorials.unread ? (
          <View style={{ flexDirection: "row" }}>
            <Text style={{ color: "coral", paddingRight: 10 }}>Messages</Text>
            <Ionicons
              style={{ color: "coral" }}
              name="md-mail-unread"
              size={20}
            />
          </View>
        ) : (
          <View style={{ flexDirection: "row" }}>
            <Text style={{ color: "white", paddingRight: 10 }}>Messages</Text>
            <Ionicons style={{ color: "white" }} name="md-mail" size={20} />
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(MessageBox);