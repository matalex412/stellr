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
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Firebase from "firebase";

import CustomLoading from "./components/CustomLoading";
import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPostScreen extends React.Component {
  state = {
    isLoading: true,
    topic: null,
  };

  componentDidMount = () => {
    if (this.props.tutorials.uservids[0] != "") {
      this.vids = this.props.tutorials.uservids;
    } else {
      this.vids = [];
    }
    this.setup();
  };

  componentWillUnmount = async () => {
    await store.dispatch(updateTutorials({ vids: this.vids }));
  };

  setup = async () => {
    // format topic string
    var post = this.props.tutorials.userpost;
    var i;
    var subtopics = post.topic.split("/topics/");
    var topic_string = subtopics[1];
    for (i = 2; i < subtopics.length; i++) {
      topic_string = topic_string + " > " + subtopics[i];
    }
    await store.dispatch(updateTutorials({ usertopic_string: topic_string }));

    // format user's post
    post.steps = Object.values(post.steps);
    post.old_topic = post.topic;
    await store.dispatch(updateTutorials({ userpost: post }));
    this.setState({ isLoading: false });
  };

  getPermissionAsync = async () => {
    // ask for permissions to use camera roll
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
    }
    await this.setState({ permission: status === "granted" });
  };

  _pickMedia = async (index, type) => {
    // ensure user has given permission to access camera roll
    if (this.state.permission != true) {
      await this.getPermissionAsync();
    }
    if (this.state.permission == true) {
      // select image or video
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
            var post = this.props.tutorials.userpost;
            post.thumbnail = result.uri;
            await store.dispatch(updateTutorials({ userpost: post }));
          } else {
            // store media and update post data
            var post = this.props.tutorials.userpost;

            // remove previous errors
            if (post.steps[index].error) {
              delete post.steps[index].error;
            }

            if (type == "Images") {
              post.steps[index][type] = result.uri;
              post.steps[index].Videos = null;

              // remove video ref
              if (this.vids[index]) {
                this.vids.slice(index, 1);
              }
            } else if (result.duration <= 60000) {
              post.steps[index][type] = result.uri;
              post.steps[index].Images = null;
            } else {
              post.steps[index].Videos = null;
              post.steps[index].error = "Videos cannot be longer than 1 minute";
            }
            post.steps[index].changed = true;
            await store.dispatch(updateTutorials({ userpost: post }));
          }
        }
      } catch (E) {
        console.log(E);
      }
    }
  };

  validateForm = async () => {
    // check post requirements have been fulfilled
    var post = this.props.tutorials.userpost;
    var steps = post.steps;
    if (steps.length >= 1) {
      var checkquery = steps.every((query) => {
        return query.step.length > 3;
      });
    }
    var checktitle = post.title.length > 3;

    if (checkquery && checktitle) {
      await this.setState({ isFormValid: true });
    } else {
      this.setState({ isFormValid: false });
    }
  };

  handleTitleChange = async (title) => {
    // change title
    var post = this.props.tutorials.userpost;
    post.title = title;
    await store.dispatch(updateTutorials({ userpost: post }));
  };

  handleFieldChange = async (value, index) => {
    // change step field
    var post = this.props.tutorials.userpost;
    post.steps[index].step = value;
    await store.dispatch(updateTutorials({ userpost: post }));
  };

  handleSubmit = async () => {
    await this.validateForm();
    if (this.state.isFormValid) {
      await this.setState({ isLoading: true });
      const { currentUser } = firebase.auth();

      // get post data
      var old_topic = this.props.tutorials.userpost.old_topic;
      var topic = this.props.tutorials.userpost.topic;
      var id = this.props.tutorials.userpost.postid;
      var steps = this.props.tutorials.userpost.steps;

      // if topic hasn't changed
      if (old_topic == topic) {
        // update base tutorial info
        await firebase
          .firestore()
          .collection(`${topic}/posts`)
          .doc(id)
          .update({
            title: this.props.tutorials.userpost.title,
          });
      } else {
        // remove old version of user's tutorial
        await firebase
          .firestore()
          .collection(`${old_topic}/posts`)
          .doc(id)
          .delete();
        await firebase
          .firestore()
          .collection(`users/${currentUser.uid}/data`)
          .doc("made")
          .update({
            [id]: Firebase.firestore.FieldValue.delete(),
          });

        // remove media from firebase storage
        var ref = await firebase
          .storage()
          .ref(`posts${old_topic}/${id}/steps/`);
        var i;
        for (i = 0; i < steps.length; i++) {
          // check if step has been changed
          if (steps[i].changed == true) {
            if (steps[i].Images != null) {
              var postRef = ref.child(`${i}/Image`);
              postRef.delete();
            } else if (steps[i].Videos != null) {
              var postRef = ref.child(`${i}/Video`);
              postRef.delete();
            }
          }
        }

        // create updated tutorial in new topic section
        var doc = await firebase
          .firestore()
          .collection(`${topic}/posts`)
          .add({
            title: this.props.tutorials.userpost.title,
            username: this.props.tutorials.userpost.username,
            uid: currentUser.uid,
            topic: topic,
            stars: this.props.tutorials.userpost.stars,
            incomplete: this.props.tutorials.userpost.stars,
            learns: this.props.tutorials.userpost.stars,
          });

        id = doc.id;
      }

      // iterate over steps and store all media in Firebase Storage
      var i;
      for (i = 0; i < steps.length; i++) {
        // remove error messages
        delete steps[i].error;

        // check if step has been changed
        if (steps[i].changed) {
          if (steps[i].Images != null) {
            const response = await fetch(steps[i].Images);
            const blob = await response.blob();

            var ref = await firebase
              .storage()
              .ref()
              .child(`${topic}/${id}/steps/${i}/Image`);
            await ref.put(blob);

            var url = await ref.getDownloadURL();
            steps[i].Images = url;
          } else if (steps[i].Videos != null) {
            const response = await fetch(steps[i].Videos);
            const blob = await response.blob();

            var ref = firebase
              .storage()
              .ref()
              .child(`${topic}/${id}/steps/${i}/Video`);
            await ref.put(blob);

            var url = await ref.getDownloadURL();
            steps[i].Videos = url;
          }
        }
        delete steps[i].changed;
      }

      var thumbnail = this.props.tutorials.userpost.thumbnail;
      // if thumbnail was changed
      if (this.state.thumb_change) {
        // store thumbnail and get reference
        const response = await fetch(this.props.tutorials.userpost.thumbnail);
        const blob = await response.blob();
        ref = await firebase
          .storage()
          .ref()
          .child(`${topic}/${id}/Thumbnail`);
        await ref.put(blob);
        thumbnail = await ref.getDownloadURL();

        await firebase
          .firestore()
          .collection(`${topic}/posts`)
          .doc(id)
          .update({
            thumbnail: thumbnail,
            steps: steps,
            time: Date.now(),
          });
      } else {
        await firebase
          .firestore()
          .collection(`${topic}/posts`)
          .doc(id)
          .update({
            steps: steps,
            time: Date.now(),
          });
      }

      // update tutorial in made section
      await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc("made")
        .set(
          {
            [id]: {
              topic: topic,
              thumbnail: thumbnail,
              title: this.props.tutorials.userpost.title,
            },
          },
          { merge: true }
        );

      Alert.alert(
        "Posted",
        "Your tutorial has been edited. Find it on the Search page or on the 'Your Posts' page"
      );
      // reset information
      await store.dispatch(updateTutorials({ userpost: null }));
      this.vids = [""];
      this.props.navigation.navigate("UserPosts");
    } else {
      Alert.alert(
        "Not Finished",
        "Sorry, your tutorial doesn't have all requirements fulfilled"
      );
    }
  };

  addStep = async () => {
    // create new step
    var post = this.props.tutorials.userpost;
    post.steps.push({ step: "" });
    await store.dispatch(updateTutorials({ userpost: post }));
    this.vids.push("");
  };

  removeStep = async (index) => {
    // remove step
    var post = this.props.tutorials.userpost;
    post.steps.splice(index, 1);
    store.dispatch(updateTutorials({ userpost: post }));

    this.vids.splice(index, 1);
  };

  deletePost = async () => {
    await this.setState({ isLoading: true });
    // check user wants to delete post
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Yes",
        onPress: async () => {
          var { currentUser } = firebase.auth();
          var post = this.props.tutorials.userpost;

          // remove tutorial
          await firebase
            .firestore()
            .collection(`${post.old_topic}/posts`)
            .doc(post.postid)
            .delete();
          await firebase
            .firestore()
            .collection(`users/${currentUser.uid}/data`)
            .doc("made")
            .update({
              [post.postid]: Firebase.firestore.FieldValue.delete(),
            });

          // remove media from firebase storage
          var ref = await firebase
            .storage()
            .ref(`posts${post.topic}/${post.postid}/steps/`);
          var i;
          for (i = 0; i < post.steps.length; i++) {
            if (post.steps[i].Images != null) {
              var postRef = ref.child(`${i}/Image`);
              postRef.delete();
            } else if (post.steps[i].Videos != null) {
              var postRef = ref.child(`${i}/Video`);
              postRef.delete();
            }
          }

          // send user message that tutorial has been made
          const message = `You're tutorial "${post.title}" has been deleted!`;
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

          await store.dispatch(updateTutorials({ userpost: null }));
          this.props.navigation.navigate("UserPosts");
        },
      },
      {
        text: "Cancel",
        onPress: () => {
          this.setState({ isLoading: false });
        },
        style: "cancel",
      },
    ]);
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
  };

  addRef = (component, index) => {
    this.vids[index] = component;
  };

  thumbnail = async () => {
    await this.setState({ pickThumbnail: true });
    await this._pickMedia("Images");
    await this.setState({ thumb_change: true });
    await this.setState({ pickThumbnail: false });
  };

  removeMedia = (index, type) => {
    // remove media
    var post = this.props.tutorials.userpost;
    post.steps[index][type] = null;
    store.dispatch(updateTutorials({ userpost: post }));
  };

  render() {
    if (this.props.tutorials.userpost) {
      var post = this.props.tutorials.userpost;
    } else {
      var post = {};
    }
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
            <CustomLoading verse="For everything there is a season, and a time for every matter" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <TextInput
                value={post.title}
                placeholder="Enter Title"
                onChangeText={(title) => this.handleTitleChange(title)}
                style={{
                  color: "white",
                  padding: 10,
                  fontSize: 23,
                  fontStyle: "italic",
                }}
              />
              <View>
                <View style={styles.line} />
              </View>
              <Image
                source={{ uri: this.props.tutorials.userpost.thumbnail }}
                style={{ margin: 10, width: width, height: 200 }}
              />
              <Text style={{ padding: 10, color: "white" }}>
                Topic: {this.props.tutorials.usertopic_string}
              </Text>
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
                      color="#ffb52b"
                    />
                    <Text style={{ margin: 3, color: "white" }}>Thumbnail</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 5 }}
                  onPress={() => this.props.navigation.navigate("UserTopic")}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Ionicons
                      name="ios-folder"
                      size={20}
                      style={{ margin: 3 }}
                      color="#ffb52b"
                    />
                    <Text style={{ margin: 3, color: "white" }}>Topic</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View>
                <View style={styles.line} />
              </View>
              {Object.values(post.steps).map((step, index) => (
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
                  key={index}
                >
                  <Text style={styles.heading}>Step {index + 1}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this._pickMedia(index, "Images")}
                    >
                      <Ionicons name="md-image" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this._pickMedia(index, "Videos")}
                    >
                      <Ionicons name="ios-videocam" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this.removeStep(index)}
                    >
                      <Ionicons name="md-trash" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                  </View>
                  {step.Videos && (
                    <View>
                      <Video
                        onPlaybackStatusUpdate={(playbackStatus) =>
                          this._onPlaybackStatusUpdate(playbackStatus, index)
                        }
                        ref={(component) => this.addRef(component, index)}
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
                        <Ionicons name="md-close" size={20} color="#6da9c9" />
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
                        <Ionicons name="md-close" size={20} color="#6da9c9" />
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
              ))}
              <TouchableOpacity style={{ padding: 10 }} onPress={this.addStep}>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <Ionicons
                    name="md-add-circle"
                    size={20}
                    style={{ margin: 3 }}
                    color="#6da9c9"
                  />
                  <Text style={{ color: "#6da9c9", margin: 3 }}>
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
                  <Text style={{ margin: 5, fontSize: 16, color: "#ffb52b" }}>
                    Update Tutorial
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.deletePost}>
                <Text
                  style={{ padding: 10, color: "#ffb52b", fontWeight: "bold" }}
                >
                  Delete Post
                </Text>
              </TouchableOpacity>
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
    color: "white",
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
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
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "black",
    borderRadius: 40,
    margin: 5,
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    margin: 10,
    width: 200,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(UserPostScreen);
