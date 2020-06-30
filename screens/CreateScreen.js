import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import { AdMobBanner } from "expo-ads-admob";
import Ionicons from "react-native-vector-icons/Ionicons";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class CreateScreen extends React.Component {
  state = {
    isLoading: true,
    isFormValid: false,
    steps: [{ step: "" }],
    checked: false
  };

  componentDidMount = () => {
    if (this.props.tutorials.vids[0] != "") {
      this.vids = this.props.tutorials.vids;
    } else {
      this.vids = [];
    }
    this.makeTopic();
  };

  componentWillUnmount = async () => {
    await store.dispatch(updateTutorials({ vids: this.vids }));
  };

  makeTopic = async () => {
    await store.dispatch(updateTutorials({ userpost: null }));
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
    this.setState({ isLoading: false });
  };

  thumbnail = async () => {
    await this.setState({ pickThumbnail: true });
    await this._pickMedia("Images");
    await this.setState({ pickThumbnail: false });
  };

  getPermissionAsync = async () => {
    const permission1 = Permissions.getAsync(Permissions.CAMERA_ROLL);
    if (permission1.status !== "granted") {
      const permission = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      const status = permission.status;
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
      await this.setState({ permission: status === "granted" });
    } else {
      await this.setState({ permission: true });
    }
  };

  _pickMedia = async (type, index) => {
    if (this.state.permission != true) {
      await this.getPermissionAsync();
    }
    if (this.state.permission == true) {
      if (this.state.pickThumbnail) {
        var options = {
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          quality: 0.8,
          allowsEditing: true
        }
      } else {
        var options = {
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          quality: 0.8,
          aspect: [1, 1],
          allowsEditing: true
        }
      }
      try {
        let result = await ImagePicker.launchImageLibraryAsync(options);
        if (!result.cancelled) {
          if (this.state.pickThumbnail) {
            await store.dispatch(updateTutorials({ thumbnail: result.uri }));
          } else {
            var steps = this.props.tutorials.steps;
            if (steps[index].error) {
              delete steps[index].error
            }
            if (type == "Images") {
              steps[index][type] = result.uri;
              steps[index].Videos = null;

              // remove video ref
              if (this.vids[index]) {
                this.vids.slice(index, 1);
              }
            } else if (result.duration <= 60000) {
              steps[index][type] = result.uri;
              steps[index].Images = null;
            } else {
              steps[index].Videos = null;
              steps[index].error =
                "Videos cannot be longer than 1 minute";
            }

            store.dispatch(updateTutorials({ steps: steps }));
          }
        }
      } catch (E) {
        console.log(E);
      }
    }
  };

  validateForm = async () => {
    // check enough writing for each step
    var steps = this.props.tutorials.steps;
    if (steps.length >= 1) {
      var checkquery = steps.every(query => {
        return query.step.length > 3;
      });
    }

    // check tutorial requirements
    var checkthumbnail = this.props.tutorials.thumbnail;
    var checktitle = this.props.tutorials.title.length > 3;
    var checktopic = this.props.tutorials.create_topic.length > 0;
    if (checkquery && checktitle && checktopic && checkthumbnail) {
      await this.setState({ isFormValid: true });
    } else {
      this.setState({ checked: true });
    }
  };

  handleTitleChange = async title => {
    await store.dispatch(updateTutorials({ title: title }));
  };

  handleSubmit = async () => {
    await this.validateForm();
    if (this.state.isFormValid) {
      this.setState({ isLoading: true });
      const { currentUser } = firebase.auth();
      if (currentUser.isAnonymous) {
        Alert.alert(
          "Create an Account",
          "To post your own tutorials and add other people's tutorials, please create an account"
        );
        this.props.navigation.navigate("Login");
      } else {
        var tutorial = {};
        tutorial.request = this.props.tutorials.request;
        tutorial.title = this.props.tutorials.title;
        tutorial.steps = this.props.tutorials.steps;
        tutorial.create_topic = this.props.tutorials.create_topic;
        tutorial.thumbnail = this.props.tutorials.thumbnail;

        // reset screen data
        await store.dispatch(updateTutorials({ request: null }));
        await store.dispatch(updateTutorials({ title: "" }));
        await store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
        await store.dispatch(updateTutorials({ create_topic: [] }));
        await store.dispatch(updateTutorials({ create_topic_string: null }));
        await store.dispatch(updateTutorials({ thumbnail: null }));

        this.setState({ isFormValid: false });
        this.setState({ isLoading: false });

        Alert.alert(
          "Thanks",
          "Thank you for making a tutorial and helping Skoach to grow. You're tutorial is being uploaded and we'll send you a message when it's done!"
        );
        this.props.navigation.navigate("Home");

        // get topic route
        var topic_route = tutorial.create_topic;
        var route;
        var topic = "";
        for (route of topic_route) {
          topic = topic + "/" + route;
        }

        var steps = tutorial.steps;
        var snapshot = await firebase
          .database()
          .ref("posts" + topic)
          .push({
            title: tutorial.title,
            steps: steps,
            username: currentUser.displayName
          });

        // get thumbnail route
        const response = await fetch(tutorial.thumbnail);
        const blob = await response.blob();

        var ref = await firebase
          .storage()
          .ref()
          .child(`posts${topic}/${snapshot.key}/Thumbnail`);
        await ref.put(blob);
        var thumbnail = await ref.getDownloadURL();

        // iterate over steps and store all media in Firebase Storage
        var i;
        for (i = 0; i < steps.length; i++) {
          // remove error messages
          delete steps[i].error;

          if (steps[i].Images != null) {
            const response = await fetch(steps[i].Images);
            const blob = await response.blob();

            ref = await firebase
              .storage()
              .ref()
              .child(`posts${topic}/${snapshot.key}/steps/${i}/Image`);
            await ref.put(blob);

            var url = await firebase
              .storage()
              .ref()
              .child(`posts${topic}/${snapshot.key}/steps/${i}/Image`)
              .getDownloadURL();
            steps[i].Images = url;
          } else if (steps[i].Videos != null) {
            const response = await fetch(steps[i].Videos);
            const blob = await response.blob();

            ref = await firebase
              .storage()
              .ref()
              .child(`posts${topic}/${snapshot.key}/steps/${i}/Video`);
            await ref.put(blob);

            var url = await firebase
              .storage()
              .ref()
              .child(`posts${topic}/${snapshot.key}/steps/${i}/Video`)
              .getDownloadURL();
            steps[i].Videos = url;
          }
        }

        await firebase
          .database()
          .ref("posts/" + topic + "/" + snapshot.key)
          .update({
            steps: steps,
            thumbnail: thumbnail
          });

        await firebase
          .database()
          .ref("users/" + currentUser.uid + "/made")
          .push({
            postid: snapshot.key,
            topic: topic,
            thumbnail: thumbnail
          });

        // update request list
        if (tutorial.request == tutorial.title) {
          await firebase
            .database()
            .ref("requests")
            .update({
              [tutorial.request]: {
                topic: topic,
                postid: snapshot.key
              }
            });
        }

        const message = `You're tutorial "${tutorial.title}" has been made!`;

        firebase
          .database()
          .ref("users/" + currentUser.uid + "/messages")
          .update({
            [message]: "unread"
          });

        await store.dispatch(updateTutorials({ unread: true }));
      }
    } else {
      Alert.alert("Not Finished", "Sorry, your tutorial doesn't have all requirements fulfilled");
    }
  };

  addStep = async () => {
    var steps = this.props.tutorials.steps;
    await store.dispatch(updateTutorials({ steps: [...steps, { step: "" }] }));
    this.vids.push("");
  };

  removeStep = async index => {
    var steps = this.props.tutorials.steps;
    steps.splice(index, 1);
    store.dispatch(updateTutorials({ steps: steps }));

    if (this.vids[index]) {
      this.vids.splice(index, 1);
    }
  };

  help = async () => {
    var post = await firebase
      .database()
      .ref("posts/Meta/-M9Ehcn1WiABy_0wDMKN")
      .once("value");
    post = post.toJSON();

    await store.dispatch(updateTutorials({ current: post }));

    this.props.navigation.navigate("Tutorial");
  };

  info = () => {
    Alert.alert(
      "Requirements",
      "A valid post must have a long enough title and topic. Each step also needs a description longer than 3 characters."
    );
  };

  changeTopic = async () => {
    await store.dispatch(updateTutorials({ userpost: null }));
    this.props.navigation.navigate("Topic");
  };

  handleFieldChange = (value, index) => {
    var steps = [...this.props.tutorials.steps];
    steps[index].step = value;
    store.dispatch(updateTutorials({ steps: steps }));
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  addRef = (component, index) => {
    this.vids[index] = component;
  };

  bannerError = () => {
    console.log("banner ad not loading");
  };

  removeMedia = (index, type) => {
    var steps = this.props.tutorials.steps
    steps[index][type] = null
    store.dispatch(updateTutorials({ steps: steps }))
  }

  render() {
    var width = Dimensions.get("window").width;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <LinearGradient
            colors={["#0b5c87", "#6da9c9"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "100%"
            }}
          />
          {this.state.isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View>
              <View style={{ margin: 10, flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/7558442816"
                  onDidFailToReceiveAdWithError={this.bannerError}
                  servePersonalizedAds
                />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <TextInput
                  placeholderTextColor={this.state.checked ? (this.props.tutorials.title.length < 4 ? "coral" : "white") : "white"}
                  value={this.props.tutorials.title}
                  placeholder="Enter Title"
                  onChangeText={title => this.handleTitleChange(title)}
                  style={{
                    color: "white",
                    padding: 10,
                    fontSize: 23,
                    fontStyle: "italic"
                  }}
                />
                <View>
                  <View style={styles.line} />
                </View>
                {this.props.tutorials.thumbnail && (
                  <Image
                    source={{ uri: this.props.tutorials.thumbnail }}
                    style={{ width: "100%", height: 200, marginBottom: 5 }}
                  />
                )}
                {this.props.tutorials.create_topic_string && (
                  <Text style={{ color: "white", padding: 10 }}>
                    Topic: {this.props.tutorials.create_topic_string}
                  </Text>
                )}
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <TouchableOpacity
                    style={{ marginRight: 5 }}
                    onPress={this.thumbnail}
                  >
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <Ionicons
                        name="md-image"
                        size={20}
                        style={{ margin: 3 }}
                        color="coral"
                      />
                      <Text
                        style={{
                          color: this.state.checked ? (this.props.tutorials.create_topic.length > 1 ? "white" : "coral") : "white",
                          margin: 3
                        }}
                      >
                        Thumbnail
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginRight: 5 }}
                    onPress={this.changeTopic}
                  >
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <Ionicons
                        name="ios-folder"
                        size={20}
                        style={{ margin: 3 }}
                        color="coral"
                      />
                      <Text
                        style={{
                          color: this.state.checked ? (this.props.tutorials.create_topic.length > 1 ? "white" : "coral") : "white",
                          margin: 3
                        }}
                      >
                        Topic
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View>
                  <View style={styles.line} />
                </View>
                {this.props.tutorials.steps.map((step, index) => (
                  <View style={{ alignItems: "center" }} key={index}>
                    <Text style={styles.heading}>Step {index + 1}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this._pickMedia("Images", index)}
                      >
                        <Ionicons name="md-image" size={25} color="coral" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this._pickMedia("Videos", index)}
                      >
                        <Ionicons name="ios-videocam" size={25} color="coral" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.removeStep(index)}
                      >
                        <Ionicons name="md-trash" size={25} color="coral" />
                      </TouchableOpacity>
                    </View>
                    {step.Videos && (
                      <View>
                        <Video
                          onPlaybackStatusUpdate={playbackStatus =>
                            this._onPlaybackStatusUpdate(playbackStatus, index)
                          }
                          ref={component => this.addRef(component, index)}
                          source={{ uri: step.Videos }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode={Video.RESIZE_MODE_CONTAIN}
                          useNativeControls
                          style={{ margin: 10, width: 200, height: 200 }}
                        />
                        <TouchableOpacity
                          style={[styles.button, styles.corner]}
                          onPress={() => this.removeMedia(index, "Videos")}
                        >
                          <Ionicons name="md-close" size={20} color="#0b5c87" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {step.Images && (
                      <View>
                        <Image
                          source={{ uri: step.Images }}
                          style={{ margin: 10, width: 200, height: 200 }}
                        />
                        <TouchableOpacity
                          style={[styles.button, styles.corner]}
                          onPress={() => this.removeMedia(index, "Images")}
                        >
                          <Ionicons name="md-close" size={20} color="#0b5c87" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {step.error && <Text style={{fontWeight: "bold", fontSize: 17, color: "coral"}}>{step.error}</Text>}
                    <TextInput
                      multiline={true}
                      value={step.step}
                      placeholder="Enter Step"
                      onChangeText={value =>
                        this.handleFieldChange(value, index)
                      }
                      placeholderTextColor={this.state.checked ? (step.step.length < 4 ? "coral" : "white") : "white"}
                      style={{
                        borderColor: "coral",
                        color: this.state.checked ? (step.step.length < 4 ? "coral" : "white") : "white",
                        width: width,
                        margin: 10,
                        fontSize: 15,
                        textAlign: "center"
                      }}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={{ padding: 10 }}
                  onPress={this.addStep}
                  disabled={this.props.tutorials.steps.length > 9}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Ionicons
                      name="md-add-circle"
                      size={20}
                      style={{ margin: 3 }}
                      color="coral"
                    />
                    <Text style={{ margin: 3, color: "white" }}>
                      Add New Step
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.handleSubmit}>
                  <View
                    style={{
                      borderRadius: 20,
                      alignItems: "center",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      backgroundColor: "#0b5c87",
                      paddingRight: 5,
                      paddingLeft: 5,
                    }}
                  >
                    <Ionicons
                      name="ios-send"
                      size={20}
                      color="coral"
                      style={{ margin: 5 }}
                    />
                    <Text style={{ margin: 5, fontSize: 16, color: "coral" }}>
                      Publish Tutorial
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.info()}>
                  <View
                    style={{
                      alignItems: "center",
                      margin: 10,
                      flexDirection: "row",
                      flexWrap: "wrap"
                    }}
                  >
                    <Ionicons
                      name="md-information-circle-outline"
                      size={12}
                      color="coral"
                    />
                    <Text
                      style={{ marginLeft: 5, fontSize: 12, color: "coral" }}
                    >
                      Requirements
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.help()}>
                  <Text style={{ marginBottom: 10, color: "white" }}>
                    Check out how to make a tutorial
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    margin: 10,
    color: "white"
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#0b5c87"
  },
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  corner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    margin: 10
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
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    margin: 10,
    width: 200
  }
});

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(CreateScreen);
