import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  Button,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from "react-native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class CreateScreen extends React.Component {
  state = {
    isFormValid: false,
    topic: null
  };

  componentDidMount = () => {
    this.makeTopic();
    this.validateForm();
  };

  makeTopic = async () => {
    var current_topic = this.props.tutorials.create_topic;
    var i;
    if (current_topic.length > 0) {
      var topic = current_topic[0];
      for (i = 1; i < current_topic.length; i++) {
        topic = topic + " > " + current_topic[i];
      }
    } else {
      var topic = null;
    }
    await store.dispatch(updateTutorials({ create_topic_string: topic }));
  };

  getPermissionAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
    await this.setState({ permission: status === "granted" });
  };

  _pickMedia = async (index, type) => {
    if (this.state.permission != true) {
      await getPermissionAsync()
    }
    if (this.state.permission == true) {
      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          aspect: [4, 3],
          quality: 1
        });
        if (!result.cancelled) {
          var steps = this.props.tutorials.steps;
          steps[index][type] = result.uri;
          if (type == "Images") {
            steps[index].Videos = null;
          } else {
            steps[index].Images = null;
          }
          store.dispatch(updateTutorials({ steps: steps }));
        }
      } catch (E) {
        console.log(E);
      }
    }
  };

  validateForm = async () => {
    var steps = this.props.tutorials.steps;
    if (steps.length >= 1) {
      var checkquery = steps.every(query => {
        return query.step.length > 3;
      });
    }
    var checktitle = this.props.tutorials.title.length > 3;
    var checktopic = this.props.tutorials.create_topic.length > 0;
    if (checkquery && checktitle && checktopic) {
      await this.setState({ isFormValid: true });
    } else {
      this.setState({ isFormValid: false });
    }
  };

  handleTitleChange = async title => {
    await store.dispatch(updateTutorials({ title: title }));
    this.validateForm();
  };

  handleFieldChange = async (value, index) => {
    var steps = this.props.tutorials.steps;
    steps[index].step = value;
    await store.dispatch(updateTutorials({ steps: steps }));
    this.validateForm();
  };

  handleSubmit = async () => {
    const { currentUser } = firebase.auth();
    if (currentUser.isAnonymous) {
      Alert.alert(
        "Create an Account",
        "To post your own tutorials and add other people's tutorials, please create an account"
      );
      this.props.navigation.navigate("Login");
    } else {
      // get topic route
      var topic_route = this.props.tutorials.create_topic;
      var route;
      var topic = "";
      for (route of topic_route) {
        topic = topic + "/" + route;
      }

      var steps = this.props.tutorials.steps;
      var snapshot = await firebase
        .database()
        .ref("posts" + topic)
        .push({
          title: this.props.tutorials.title,
          steps: steps,
          username: currentUser.displayName
        });
      await firebase
        .database()
        .ref("users/" + currentUser.uid + "/made")
        .push({
          postid: snapshot.key,
          topic: topic
        });

      // iterate over steps and store all media in Firebase Storage
      var i;
      for (i = 0; i < steps.length; i++) {
        if (steps[i].Images != null) {
          const response = await fetch(steps[i].Images);
          const blob = await response.blob();

          var ref = firebase
            .storage()
            .ref()
            .child(`posts${topic}/${snapshot.key}/steps/${i}/Image`);
          ref.put(blob);
        } else if (steps[i].Videos != null) {
          const response = await fetch(steps[i].Videos);
          const blob = await response.blob();

          var ref = firebase
            .storage()
            .ref()
            .child(`posts${topic}/${snapshot.key}/steps/${i}/Video`);
          ref.put(blob);
        }
      }

      Alert.alert(
        "Posted",
        "Your tutorial has been made. Find it on the Search page or on the 'Your Posts' page"
      );
      store.dispatch(updateTutorials({ title: "" }));
      store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
      store.dispatch(updateTutorials({ create_topic: [] }));
      store.dispatch(updateTutorials({ create_topic_string: topic }));
      this.props.navigation.navigate("Home");
    }
  };

  addStep = async () => {
    var steps = this.props.tutorials.steps;
    await store.dispatch(updateTutorials({ steps: [...steps, { step: "" }] }));
    this.validateForm();
  };

  removeStep = async index => {
    var steps = this.props.tutorials.steps;
    steps.splice(index, 1);
    store.dispatch(updateTutorials({ steps: steps }));
    this.validateForm();
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <TextInput
            value={this.props.tutorials.title}
            placeholder="Enter Title"
            onChangeText={title => this.handleTitleChange(title)}
            style={{ padding: 10, fontSize: 23, fontStyle: "italic" }}
          />
          {this.props.tutorials.create_topic && (
            <Text style={{ padding: 10 }}>
              Topic: {this.props.tutorials.create_topic_string}
            </Text>
          )}
          <Button
            color="coral"
            title="Add Topic"
            onPress={() => this.props.navigation.navigate("Topic")}
          />
          {this.props.tutorials.steps.map((step, index) => (
            <View style={{ alignItems: "center" }} key={index}>
              <Text style={styles.heading}>Step {index + 1}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => this._pickMedia(index, "Images")}
                >
                  <Ionicons name="md-image" size={25} color="coral" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => this._pickMedia(index, "Videos")}
                >
                  <Ionicons name="ios-videocam" size={25} color="coral" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => this.removeStep(index)}
                >
                  <Ionicons name="md-close" size={25} color="coral" />
                </TouchableOpacity>
              </View>
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
              {step.Images && (
                <Image
                  source={{ uri: step.Images }}
                  style={{ margin: 10, width: 200, height: 200 }}
                />
              )}
              <TextInput
                multiline={true}
                value={step.step}
                placeholder="Enter Step"
                onChangeText={value => this.handleFieldChange(value, index)}
                style={{ padding: 10, fontSize: 15 }}
              />
            </View>
          ))}
          <TouchableOpacity style={{ padding: 10 }} onPress={this.addStep}>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Ionicons
                name="md-add-circle"
                size={20}
                style={{ margin: 3 }}
                color="coral"
              />
              <Text style={{ margin: 3 }}>Add New Step</Text>
            </View>
          </TouchableOpacity>
          <Button
            color="coral"
            title="Publish Post"
            onPress={this.handleSubmit}
            disabled={!this.state.isFormValid}
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    margin: 10
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#fff"
  },
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    margin: 5
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(CreateScreen);
