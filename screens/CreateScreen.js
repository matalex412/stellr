import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import { AdMobBanner } from "expo-ads-admob";
import Ionicons from "react-native-vector-icons/Ionicons";

import CustomLoading from "./components/CustomLoading";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class CreateScreen extends React.Component {
  state = {
    isLoading: true,
    isFormValid: false,
    steps: [{ step: "" }],
    checked: false,
  };

  componentDidMount = () => {
    // get video references (for after user chooses topic)
    if (this.props.tutorials.vids[0] != "") {
      this.vids = this.props.tutorials.vids;
    } else {
      this.vids = [];
    }
    this.makeTopic();
  };

  componentWillUnmount = async () => {
    // store video references (when users chooses topic)
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
    // ask for permission to access camera roll
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
    // get permissions
    if (this.state.permission != true) {
      await this.getPermissionAsync();
    }
    if (this.state.permission == true) {
      if (this.state.pickThumbnail) {
        var options = {
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          quality: 0.8,
          allowsEditing: true,
        };
      } else {
        var options = {
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          quality: 0.8,
          aspect: [1, 1],
          allowsEditing: true,
        };
      }
      try {
        let result = await ImagePicker.launchImageLibraryAsync(options);
        if (!result.cancelled) {
          if (this.state.pickThumbnail) {
            await store.dispatch(updateTutorials({ thumbnail: result.uri }));
          } else {
            var steps = this.props.tutorials.steps;
            if (steps[index].error) {
              delete steps[index].error;
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
              steps[index].error = "Videos cannot be longer than 1 minute";
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
    // check tutorial requirements
    var checkthumbnail = this.props.tutorials.thumbnail;
    var checktitle = this.props.tutorials.title.length > 3;
    var checktopic = this.props.tutorials.create_topic.length > 0;
    if (checktitle && checktopic && checkthumbnail) {
      await this.setState({ isFormValid: true });
    } else {
      this.setState({ checked: true });
    }
  };

  handleTitleChange = async (title) => {
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
        firebase.auth().signOut();
      } else {
        // store tutorial data
        var tutorial = {};
        var steps = this.props.tutorials.steps;
        tutorial.request = this.props.tutorials.request;
        tutorial.title = this.props.tutorials.title;
        tutorial.create_topic = this.props.tutorials.create_topic;
        tutorial.thumbnail = this.props.tutorials.thumbnail;
        var topic = this.props.tutorials.create_topic;

        // reset screen data
        await store.dispatch(updateTutorials({ request: null }));
        await store.dispatch(updateTutorials({ title: "" }));
        await store.dispatch(updateTutorials({ steps: [{ step: "" }] }));
        await store.dispatch(updateTutorials({ create_topic: [] }));
        await store.dispatch(updateTutorials({ create_topic_string: null }));
        await store.dispatch(updateTutorials({ thumbnail: null }));

        this.setState({ isFormValid: false });
        this.setState({ isLoading: false });

        // redirect user
        Alert.alert(
          "Thanks",
          "Thank you for making a tutorial and helping Skoach grow. You're tutorial is being uploaded and we'll send you a message when it's done!"
        );
        this.props.navigation.navigate("Home");

        // get topic route
        var topic_route = tutorial.create_topic;
        var route;
        var topic = "";
        for (route of topic_route) {
          topic = topic + "/topics/" + route;
        }

        // add base for tutorial
        var docRef = await firebase
          .firestore()
          .collection(topic + "/posts")
          .add({
            title: tutorial.title,
            username: currentUser.displayName,
            uid: currentUser.uid,
            topic: topic,
            stars: 0,
            incomplete: 0,
            learns: 0,
          });

        // store thumbnail and get route
        const response = await fetch(tutorial.thumbnail);
        const blob = await response.blob();
        var ref = await firebase
          .storage()
          .ref()
          .child(`${topic}/${docRef.id}/Thumbnail`);
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
              .child(`${topic}/${docRef.id}/steps/${i}/Image`);
            await ref.put(blob);

            var url = await firebase
              .storage()
              .ref()
              .child(`${topic}/${docRef.id}/steps/${i}/Image`)
              .getDownloadURL();
            steps[i].Images = url;
          } else if (steps[i].Videos != null) {
            const response = await fetch(steps[i].Videos);
            const blob = await response.blob();

            ref = await firebase
              .storage()
              .ref()
              .child(`${topic}/${docRef.id}/steps/${i}/Video`);
            await ref.put(blob);

            var url = await firebase
              .storage()
              .ref()
              .child(`${topic}/${docRef.id}/steps/${i}/Video`)
              .getDownloadURL();
            steps[i].Videos = url;
          }
        }

        // update tutorial with valid links to media
        await firebase
          .firestore()
          .collection(topic + "/posts")
          .doc(docRef.id)
          .update({
            steps: steps,
            thumbnail: thumbnail,
            time: Date.now(),
          });

        // add tutorial to made document for user
        await firebase
          .firestore()
          .collection("users/" + currentUser.uid + "/data")
          .doc("made")
          .set(
            {
              [docRef.id]: {
                topic: topic,
                thumbnail: thumbnail,
                title: tutorial.title,
              },
            },
            { merge: true }
          );

        // update request list
        if (tutorial.request == tutorial.title) {
          await firebase
            .database()
            .ref("requests")
            .update({
              [tutorial.request]: {
                topic: topic,
                postid: docRef.id,
              },
            });
        }

        // notify user that tutorial has been made
        const message = `You're tutorial "${tutorial.title}" has been made!`;
        firebase
          .firestore()
          .collection(`users/${currentUser.uid}/data`)
          .doc("messages")
          .set(
            {
              [Date.now()]: {
                message: message,
                status: "unread",
              },
            },
            { merge: true }
          );
        await store.dispatch(updateTutorials({ unread: true }));
      }
    } else {
      Alert.alert(
        "Not Finished",
        "Sorry, your tutorial doesn't have all requirements fulfilled (make sure you've added a thumbnail and topic)"
      );
    }
  };

  addStep = async () => {
    // add new step and empty video ref
    var steps = this.props.tutorials.steps;
    await store.dispatch(updateTutorials({ steps: [...steps, { step: "" }] }));
    this.vids.push("");
  };

  removeStep = async (index) => {
    // remove step and video reference
    var steps = this.props.tutorials.steps;
    steps.splice(index, 1);
    store.dispatch(updateTutorials({ steps: steps }));
    if (this.vids[index]) {
      this.vids.splice(index, 1);
    }
  };

  help = async () => {
    // store post and redirect user to tutorial screen
    var post = firebase
      .firestore()
      .collection(`topics/Meta/posts`)
      .doc("iuyEJIBF63QJRhcBNNQ6")
      .get();
    await store.dispatch(updateTutorials({ current: post }));
    await store.dispatch(updateTutorials({ tutorial_topic: "topics/Meta" }));
    await store.dispatch(
      updateTutorials({ current_key: "iuyEJIBF63QJRhcBNNQ6" })
    );
    this.props.navigation.navigate("Tutorial");
  };

  info = () => {
    Alert.alert(
      "Requirements",
      "Please make sure you've added a thumbnail and topic to your tutorial. A valid post must have a long enough title and each step also needs a description longer than 3 characters."
    );
  };

  changeTopic = async () => {
    // clear data about user's made post and redirect user to topic screen
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

  removeMedia = (index, type) => {
    // remove media
    var steps = this.props.tutorials.steps;
    steps[index][type] = null;
    store.dispatch(updateTutorials({ steps: steps }));
  };

  render() {
    var width = Dimensions.get("window").width;
    return (
      <View style={styles.container}>
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
          {this.state.isLoading ? (
            <CustomLoading verse="Do you see a man skillful in his work? He will stand before kings" />
          ) : (
            <View>
              <View style={{ margin: 10, flex: 1, flexDirection: "column" }}>
                <AdMobBanner
                  adUnitID="ca-app-pub-3262091936426324/7558442816"
                  onDidFailToReceiveAdWithError={() =>
                    console.log("banner ad not loading")
                  }
                  servePersonalizedAds
                />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <TextInput
                  placeholderTextColor={
                    this.state.checked
                      ? this.props.tutorials.title.length < 4
                        ? "#ffb52b"
                        : "white"
                      : "white"
                  }
                  value={this.props.tutorials.title}
                  placeholder="Enter Title"
                  onChangeText={(title) =>
                    store.dispatch(updateTutorials({ title: title }))
                  }
                  style={{
                    color: "black",
                    padding: 10,
                    fontSize: 23,
                    fontStyle: "italic",
                  }}
                />
                {this.props.tutorials.thumbnail && (
                  <Image
                    source={{ uri: this.props.tutorials.thumbnail }}
                    style={{ width: "100%", height: 200, marginBottom: 5 }}
                  />
                )}
                {this.props.tutorials.create_topic_string && (
                  <Text style={{ color: "black", padding: 10 }}>
                    Topic: {this.props.tutorials.create_topic_string}
                  </Text>
                )}
                <View
                  style={{
                    backgroundColor: "black",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    padding: 10,
                    borderRadius: 30,
                  }}
                >
                  <TouchableOpacity
                    style={{ marginRight: 5 }}
                    onPress={this.thumbnail}
                  >
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <Ionicons
                        name="md-image"
                        size={20}
                        style={{ margin: 3 }}
                        color="#ffb52b"
                      />
                      <Text
                        style={{
                          color: this.state.checked
                            ? this.props.tutorials.create_topic.length > 1
                              ? "white"
                              : "#ffb52b"
                            : "white",
                          margin: 3,
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
                        color="#ffb52b"
                      />
                      <Text
                        style={{
                          color: this.state.checked
                            ? this.props.tutorials.create_topic.length > 1
                              ? "white"
                              : "#ffb52b"
                            : "white",
                          margin: 3,
                        }}
                      >
                        Topic
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {this.props.tutorials.steps.map((step, index) => (
                  <View
                    key={index}
                    style={{
                      alginItems: "center",
                      margin: 5,
                      flexDirection: "row",
                      flexWrap: "wrap",
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "center",
                        backgroundColor: "#6da9c9",
                        borderRadius: 10,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this._pickMedia("Images", index)}
                      >
                        <Ionicons name="md-image" size={25} color="#ffb52b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this._pickMedia("Videos", index)}
                      >
                        <Ionicons
                          name="ios-videocam"
                          size={25}
                          color="#ffb52b"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.removeStep(index)}
                      >
                        <Ionicons name="md-trash" size={25} color="#ffb52b" />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={{
                        alignItems: "center",
                        backgroundColor: "#6da9c9",
                        width: width - 100,
                        padding: 10,
                        margin: 10,
                        borderRadius: 5,
                        shadowOffset: { width: 10, height: 10 },
                        shadowColor: "black",
                        shadowOpacity: 1.0,
                      }}
                    >
                      <Text style={styles.heading}>Step {index + 1}</Text>
                      {step.Videos && (
                        <View>
                          <Video
                            onPlaybackStatusUpdate={(playbackStatus) =>
                              this._onPlaybackStatusUpdate(
                                playbackStatus,
                                index
                              )
                            }
                            ref={(component) => (this.vids[index] = component)}
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
                            <Ionicons
                              name="md-close"
                              size={20}
                              color="#6da9c9"
                            />
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
                            <Ionicons
                              name="md-close"
                              size={20}
                              color="#6da9c9"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                      {step.error && (
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 17,
                            color: "#ffb52b",
                          }}
                        >
                          {step.error}
                        </Text>
                      )}
                      <TextInput
                        multiline={true}
                        value={step.step}
                        placeholder="Enter Step"
                        onChangeText={(value) =>
                          this.handleFieldChange(value, index)
                        }
                        placeholderTextColor={
                          this.state.checked
                            ? step.step.length < 4
                              ? "#ffb52b"
                              : "black"
                            : "black"
                        }
                        style={{
                          borderColor: "#ffb52b",
                          color: this.state.checked
                            ? step.step.length < 4
                              ? "#ffb52b"
                              : "black"
                            : "black",
                          width: width,
                          paddingLeft: 60,
                          paddingRight: 60,
                          margin: 10,
                          fontSize: 15,
                          textAlign: "center",
                        }}
                      />
                    </View>
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
                      color="#6da9c9"
                    />
                    <Text style={{ margin: 3, color: "#6da9c9" }}>
                      Add New Step
                    </Text>
                  </View>
                </TouchableOpacity>
                <View
                  style={{
                    marginBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity onPress={this.handleSubmit}>
                    <View
                      style={{
                        borderRadius: 20,
                        alignItems: "center",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        backgroundColor: "#6da9c9",
                        paddingRight: 5,
                        paddingLeft: 5,
                      }}
                    >
                      <Ionicons
                        name="ios-send"
                        size={20}
                        color="#ffb52b"
                        style={{ margin: 5 }}
                      />
                      <Text
                        style={{ margin: 5, fontSize: 16, color: "#ffb52b" }}
                      >
                        Publish Tutorial
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.info}>
                    <Ionicons
                      name="md-information-circle-outline"
                      size={20}
                      style={{ margin: 5 }}
                      color="#ffb52b"
                    />
                  </TouchableOpacity>
                </View>
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
    color: "black",
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#6da9c9",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  corner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    margin: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "#000",
    borderRadius: 40,
    margin: 5,
  },
  line: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    margin: 10,
    width: 200,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(CreateScreen);
