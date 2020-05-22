import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from "react-native";
import { Video } from "expo-av";
import { connect } from "react-redux";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";

class UserPostScreen extends React.Component {
  state = {
    isLoading: true
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={{ fontSize: 20, fontStyle: "italic" }}>
            {this.props.tutorials.userpost.title}
          </Text>
          {Object.values(this.props.tutorials.userpost.steps).map(
            (step, index) => (
              <View style={{ alignItems: "center", padding: 10 }} key={index}>
                <Text style={styles.heading}>Step {index + 1}</Text>
                {step.Images && (
                  <Image
                    source={{ uri: step.Images }}
                    style={{ margin: 10, width: 200, height: 200 }}
                  />
                )}
                {step.Videos && (
                  <Video
                    source={{ uri: step.Videos }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode="cover"
                    useNativeControls
                    style={{ margin: 10, width: 200, height: 200 }}
                  />
                )}
                <Text>{step.step}</Text>
              </View>
            )
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#fff"
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold"
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(UserPostScreen);
