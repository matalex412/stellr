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
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { store } from "./../redux/store";
import { updateTutorials } from "./../redux/actions";
import { firebase } from "./../src/config";

class UserPostScreen extends React.Component {
  state = {
    isLoading: true,
    topic: null
  };

  componentDidMount = () => {
    if (this.props.tutorials.uservids[0] != "") {
      this.vids = this.props.tutorials.uservids;
    } else {
      this.vids = [];
    }

    this.setup();
    this.validateForm();
  };

  componentWillUnmount = async () => {
    await store.dispatch(updateTutorials({ vids: this.vids }));
  };

  setup = async () => {
    // get and format user's post
    var post = this.props.tutorials.userpost;
    post.steps = Object.values(post.steps);
    await store.dispatch(updateTutorials({ userpost: post }));
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
      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions[type],
          aspect: [4, 3],
          quality: 1
        });
        if (!result.cancelled) {
          if (this.state.pickThumbnail) {
            var post = this.props.tutorials.userpost;
            post.thumbnail = result.uri;
            await store.dispatch(updateTutorials({ userpost: post }));
          } else {
            this.setState({ step_changed: true });
            // store media and update post data
            var post = this.props.tutorials.userpost;
            post.steps[index][type] = result.uri;
            if (type == "Images") {
              post.steps[index].Videos = null;

              // remove video ref
              if (this.vids[index]) {
                this.vids.slice(index, 1);
              }
            } else {
              post.steps[index].Images = null;
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
      var checkquery = steps.every(query => {
        return query.step.length > 3;
      });
    }
    var checktitle = post.title.length > 3;

    if (checkquery && checktitle) {
      await this.setState({ isFormValid: true });
    } else {
      this.setState({ isFormValid: false });
    }
    this.setState({ isLoading: false });
  };

  handleTitleChange = async title => {
    // change title
    var post = this.props.tutorials.userpost;
    post.title = title;
    await store.dispatch(updateTutorials({ userpost: post }));
    this.validateForm();
  };

  handleFieldChange = async (value, index) => {
    // change step field
    var post = this.props.tutorials.userpost;
    post.steps[index].step = value;
    post.steps[index].changed = true;
    await store.dispatch(updateTutorials({ userpost: post }));
    this.validateForm();
  };

  handleSubmit = async () => {
    // get current user
    await this.setState({ isLoading: true });
    const { currentUser } = firebase.auth();

    // get post data
    var old_topic = this.props.tutorials.userpost.old_topic;
    var topic = this.props.tutorials.userpost.topic;
    var id = this.props.tutorials.userpost.postid;
    var steps = this.props.tutorials.userpost.steps;

    // if topic hasn't changed
    if (old_topic == topic) {
      // update tutorial info
      await firebase
        .database()
        .ref("posts" + topic + "/" + id)
        .update({
          title: this.props.tutorials.userpost.title,
          steps: this.props.tutorials.userpost.steps
        });
    } else {
      // remove old tutorial made by user
      var made = await firebase
        .database()
        .ref("users/" + currentUser.uid + "/made")
        .once("value");
      made = made.toJSON();
      var keys = Object.keys(made);
      var key;
      for (key of keys) {
        if (made[key].postid == id) {
          var madeid = key;
        }
      }
      var postRef = await firebase
        .database()
        .ref("posts" + old_topic + "/" + id);
      postRef.remove();

      // remove media from firebase storage
      var ref = await firebase.storage().ref(`posts${old_topic}/${id}/steps/`);
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

      // create updated tutorial
      var snapshot = await firebase
        .database()
        .ref("posts" + topic)
        .push({
          title: this.props.tutorials.userpost.title,
          username: this.props.tutorials.userpost.username
        });
      await firebase
        .database()
        .ref("users/" + currentUser.uid + "/made/" + madeid)
        .update({
          postid: snapshot.key,
          topic: topic
        });

      id = snapshot.key;
    }

    // iterate over steps and store all media in Firebase Storage
    var i;
    for (i = 0; i < steps.length; i++) {
      // check if step has been changed
      if (steps[i].changed) {
        if (steps[i].Images != null) {
          const response = await fetch(steps[i].Images);
          const blob = await response.blob();

          var ref = await firebase
            .storage()
            .ref()
            .child(`posts${topic}/${id}/steps/${i}/Image`);
          await ref.put(blob);

          var url = await ref.getDownloadURL();
          steps[i].Images = url;
        } else if (steps[i].Videos != null) {
          const response = await fetch(steps[i].Videos);
          const blob = await response.blob();

          var ref = firebase
            .storage()
            .ref()
            .child(`posts${topic}/${id}/steps/${i}/Video`);
          await ref.put(blob);

          var url = await ref.getDownloadURL();
          steps[i].Videos = url;
        }
      }
      steps[i].changed = false;
    }

    if (this.state.thumb_change) {
      // get thumbnail link
      const response = await fetch(this.props.tutorials.userpost.thumbnail);
      const blob = await response.blob();
      ref = await firebase
        .storage()
        .ref()
        .child(`posts${topic}/${id}/Thumbnail`);
      await ref.put(blob);
      var thumbnail = await ref.getDownloadURL();

      await firebase
        .database()
        .ref("posts/" + topic + "/" + id)
        .update({ thumbnail: thumbnail });
    }

    // add steps to updated tutorial
    await firebase
      .database()
      .ref("posts/" + topic + "/" + id)
      .update({
        steps: steps
      });

    // reset information
    Alert.alert(
      "Posted",
      "Your tutorial has been edited. Find it on the Search page or on the 'Your Posts' page"
    );
    await store.dispatch(updateTutorials({ userpost: null }));
    this.props.navigation.navigate("UserPosts");
  };

  addStep = async () => {
    // create new step
    var post = this.props.tutorials.userpost;
    post.steps.push({ step: "" });
    await store.dispatch(updateTutorials({ userpost: post }));
    this.validateForm();
    this.vids.push("");
  };

  removeStep = async index => {
    // remove step
    var post = this.props.tutorials.userpost;
    post.steps.splice(index, 1);
    store.dispatch(updateTutorials({ userpost: post }));
    this.validateForm();

    this.vids.splice(index, 1);
  };

  deletePost = async () => {
    // check user wants to delete post
    await this.setState({ isLoading: true });
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Yes",
        onPress: async () => {
          await firebase
            .database()
            .ref(
              "posts" +
                this.props.tutorials.userpost.old_topic +
                "/" +
                this.props.tutorials.userpost.postid
            )
            .remove();

          // remove old tutorial made by user
          var { currentUser } = firebase.auth();
          var post = this.props.tutorials.userpost;
          var made = await firebase
            .database()
            .ref("users/" + currentUser.uid + "/made")
            .once("value");
          made = made.toJSON();
          var keys = Object.keys(made);
          var key;
          for (key of keys) {
            if (made[key].postid == post.postid) {
              var madeRef = await firebase
                .database()
                .ref("users/" + currentUser.uid + "/made/" + key);
              madeRef.remove();

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

              break;
            }
          }

          await store.dispatch(updateTutorials({ userpost: null }));
          this.props.navigation.navigate("UserPosts");
        }
      },
      {
        text: "Cancel",
        onPress: () => {
          this.setState({ isLoading: false });
        },
        style: "cancel"
      }
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
    await this.validateForm();
    await this.setState({ pickThumbnail: false });
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
            <View style={{ alignItems: "center" }}>
              <TextInput
                value={post.title}
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
              <Image
                source={{ uri: this.props.tutorials.userpost.thumbnail }}
                style={{ margin: 10, width: width, height: 200 }}
              />
              <Text style={{ padding: 10, color: "white" }}>
                Topic: {this.props.tutorials.userpost.topic}
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
                      color="coral"
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
                      color="coral"
                    />
                    <Text style={{ margin: 3, color: "white" }}>Topic</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View>
                <View style={styles.line} />
              </View>
              {Object.values(post.steps).map((step, index) => (
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
                    style={{
                      color: "white",
                      width: width,
                      padding: 10,
                      fontSize: 15,
                      textAlign: "center"
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
                    color="coral"
                  />
                  <Text style={{ color: "white", margin: 3 }}>
                    Add New Step
                  </Text>
                </View>
              </TouchableOpacity>
              <Button
                color="coral"
                title="Update Post"
                onPress={this.handleSubmit}
                disabled={!this.state.isFormValid}
              />
              <TouchableOpacity onPress={this.deletePost}>
                <Text
                  style={{ padding: 10, color: "coral", fontWeight: "bold" }}
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
    color: "white"
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
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

export default connect(mapStateToProps)(UserPostScreen);
