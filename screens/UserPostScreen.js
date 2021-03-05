import React from 'react';
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
} from 'react-native';
import VideoPlayer from 'react-native-video-controls';
import ImagePicker from 'react-native-image-picker';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Firebase from 'firebase';
import RNFetchBlob from 'rn-fetch-blob';

import CustomLoading from './components/CustomLoading';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

const Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

class UserPostScreen extends React.Component {
  state = {
    isLoading: true,
    topic: null,
  };

  componentDidMount = () => {
    if (this.props.tutorials.uservids[0] != '') {
      this.vids = this.props.tutorials.uservids;
    } else {
      this.vids = [];
    }
    this.setup();
  };

  componentWillUnmount = async () => {
    await store.dispatch(updateTutorials({vids: this.vids}));
  };

  uploadImage(uri, mime = 'image/jpeg', refName) {
    return new Promise((resolve, reject) => {
      const {currentUser} = firebase.auth();
      const ref = firebase.storage().ref(refName);
      let uploadBlob = null;

      fs.readFile(uri, 'base64')
        .then((data) => {
          return Blob.build(data, {type: `${mime};BASE64`});
        })
        .then((blob) => {
          uploadBlob = blob;
          return ref.put(blob, {contentType: mime});
        })
        .then(() => {
          uploadBlob.close();
          return ref.getDownloadURL();
        })
        .then((url) => {
          resolve(url);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  setup = async () => {
    // format topic string
    var post = this.props.tutorials.userpost;
    var i;
    var subtopics = post.topic.split('/topics/');
    var topic_string = subtopics[1];
    for (i = 2; i < subtopics.length; i++) {
      topic_string = topic_string + ' > ' + subtopics[i];
    }
    await store.dispatch(updateTutorials({usertopic_string: topic_string}));

    // format user's post
    post.steps = Object.values(post.steps);
    post.old_topic = post.topic;
    await store.dispatch(updateTutorials({userpost: post}));
    this.setState({isLoading: false});
  };

  _pickMedia = async (index, type) => {
    // ensure user has given permission to access camera roll

    if (type == 'Videos') {
      var mediaType = 'video';
    } else {
      var mediaType = 'photo';
    }
    if (this.state.pickThumbnail) {
      var options = {
        mediaType: mediaType,
        quality: 0.6,
      };
    } else {
      var options = {
        mediaType: mediaType,
        quality: 0.6,
        maxWidth: 500,
        maxHeight: 500,
      };
    }
    try {
      ImagePicker.launchImageLibrary(options, (result) => {
        if (!result.cancelled) {
          if (this.state.pickThumbnail) {
            var post = this.props.tutorials.userpost;
            post.thumbnail = result.uri;
            store.dispatch(updateTutorials({userpost: post}));
            this.setState({thumb_change: true});
            this.setState({pickThumbnail: false});
          } else {
            // store media and update post data
            var post = this.props.tutorials.userpost;

            // remove previous errors
            if (post.steps[index].error) {
              delete post.steps[index].error;
            }

            if (type == 'Images') {
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
              post.steps[index].error = 'Videos cannot be longer than 1 minute';
            }
            post.steps[index].changed = true;
            store.dispatch(updateTutorials({userpost: post}));
          }
        }
      });
    } catch (E) {
      console.log(E);
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
      await this.setState({isFormValid: true});
    } else {
      this.setState({isFormValid: false});
    }
  };

  handleTitleChange = async (title) => {
    // change title
    var post = this.props.tutorials.userpost;
    post.title = title;
    await store.dispatch(updateTutorials({userpost: post}));
  };

  handleFieldChange = async (value, index) => {
    // change step field
    var post = this.props.tutorials.userpost;
    post.steps[index].step = value;
    await store.dispatch(updateTutorials({userpost: post}));
  };

  handleSubmit = async () => {
    await this.validateForm();
    if (this.state.isFormValid) {
      await this.setState({isLoading: true});
      const {currentUser} = firebase.auth();

      // get post data
      var old_topic = this.props.tutorials.userpost.old_topic;
      var topic = this.props.tutorials.userpost.topic;
      var id = this.props.tutorials.userpost.postid;
      var steps = this.props.tutorials.userpost.steps;

      // if topic hasn't changed
      if (old_topic == topic) {
        // update base tutorial info
        await firebase.firestore().collection(`${topic}/posts`).doc(id).update({
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
          .doc('made')
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
        var doc = await firebase.firestore().collection(`${topic}/posts`).add({
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
            var refName = `${topic}/${id}/steps/${i}/Image`;
            var url = await this.uploadImage(
              steps[i].Images,
              'image/jpeg',
              refName,
            );
            steps[i].Images = url;
          } else if (steps[i].Videos != null) {
            var refName = `${topic}/${id}/steps/${i}/Video`;
            var url = await this.uploadImage(
              steps[i].Videos,
              'video/mp4',
              refName,
            );
            steps[i].Videos = url;
          }
        }
        delete steps[i].changed;
      }

      var thumbnail = this.props.tutorials.userpost.thumbnail;
      // if thumbnail was changed
      if (this.state.thumb_change) {
        // store thumbnail and get reference
        var refName = `${topic}/${id}/Thumbnail`;
        thumbnail = await this.uploadImage(
          this.props.tutorials.userpost.thumbnail,
          'image/jpeg',
          refName,
        );

        await firebase.firestore().collection(`${topic}/posts`).doc(id).update({
          thumbnail: thumbnail,
          steps: steps,
          time: Date.now(),
        });
      } else {
        await firebase.firestore().collection(`${topic}/posts`).doc(id).update({
          steps: steps,
          time: Date.now(),
        });
      }

      // update tutorial in made section
      await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('made')
        .set(
          {
            [id]: {
              topic: topic,
              thumbnail: thumbnail,
              title: this.props.tutorials.userpost.title,
            },
          },
          {merge: true},
        );

      // notify user that tutorial has been updated
      const message = `You're tutorial "${this.props.tutorials.userpost.title}" has been updated!`;
      firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('messages')
        .set(
          {
            [Date.now()]: {
              message: message,
              status: 'unread',
            },
          },
          {merge: true},
        );
      await store.dispatch(updateTutorials({unread: true}));

      Alert.alert(
        'Posted',
        "Your tutorial has been edited. Find it on the Search page or on the 'Your Posts' page",
      );
      // reset information
      await store.dispatch(updateTutorials({userpost: null}));
      this.vids = [''];
      this.props.navigation.navigate('UserPosts');
    } else {
      Alert.alert(
        'Not Finished',
        "Sorry, your tutorial doesn't have all requirements fulfilled",
      );
    }
  };

  addStep = async () => {
    // create new step
    var post = this.props.tutorials.userpost;
    post.steps.push({step: ''});
    await store.dispatch(updateTutorials({userpost: post}));
    this.vids.push('');
  };

  removeStep = async (index) => {
    // remove step
    var post = this.props.tutorials.userpost;
    post.steps.splice(index, 1);
    store.dispatch(updateTutorials({userpost: post}));

    this.vids.splice(index, 1);
  };

  deletePost = async () => {
    await this.setState({isLoading: true});
    // check user wants to delete post
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {
        text: 'Yes',
        onPress: async () => {
          var {currentUser} = firebase.auth();
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
            .doc('made')
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
            .doc('messages')
            .set(
              {
                [Date.now()]: {
                  message: message,
                  status: 'unread',
                },
              },
              {merge: true},
            );
          await store.dispatch(updateTutorials({unread: true}));

          await store.dispatch(updateTutorials({userpost: null}));
          this.props.navigation.navigate('UserPosts');
        },
      },
      {
        text: 'Cancel',
        onPress: () => {
          this.setState({isLoading: false});
        },
        style: 'cancel',
      },
    ]);
  };

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({shouldPlay: false, positionMillis: 0});
    }
  };

  addRef = (component, index) => {
    this.vids[index] = component;
  };

  thumbnail = async () => {
    await this.setState({pickThumbnail: true});
    await this._pickMedia('Images');
  };

  removeMedia = (index, type) => {
    // remove media
    var post = this.props.tutorials.userpost;
    post.steps[index][type] = null;
    store.dispatch(updateTutorials({userpost: post}));
  };

  render() {
    if (this.props.tutorials.userpost) {
      var post = this.props.tutorials.userpost;
    } else {
      var post = {};
    }
    var width = Dimensions.get('window').width;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <CustomLoading verse="For everything there is a season, and a time for every matter" />
          ) : (
            <View style={{alignItems: 'center'}}>
              <TextInput
                value={post.title}
                placeholder="Enter Title"
                onChangeText={(title) => this.handleTitleChange(title)}
                style={{
                  color: '#2274A5',
                  padding: 10,
                  fontSize: 23,
                  fontStyle: 'italic',
                }}
              />
              <Image
                source={{uri: this.props.tutorials.userpost.thumbnail}}
                style={{margin: 10, width: width, height: 200}}
              />
              <Text style={{padding: 10, color: '#2274A5'}}>
                Topic: {this.props.tutorials.usertopic_string}
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                <TouchableOpacity
                  style={{marginRight: 5}}
                  onPress={this.thumbnail}>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                    <Ionicons
                      name="md-image"
                      size={20}
                      style={{margin: 3}}
                      color="#2274A5"
                    />
                    <Text style={{margin: 3, color: '#2274A5'}}>Thumbnail</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{marginRight: 5}}
                  onPress={() => this.props.navigation.navigate('UserTopic')}>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                    <Ionicons
                      name="ios-folder"
                      size={20}
                      style={{margin: 3}}
                      color="#2274A5"
                    />
                    <Text style={{margin: 3, color: '#2274A5'}}>Topic</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {Object.values(post.steps).map((step, index) => (
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    elevation: 3,
                    width: width - 100,
                    padding: 10,
                    margin: 10,
                    borderRadius: 5,
                    shadowOffset: {width: 10, height: 10},
                    shadowColor: '#2274A5',
                    shadowOpacity: 1.0,
                  }}
                  key={index}>
                  <Text style={styles.heading}>Step {index + 1}</Text>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this._pickMedia(index, 'Images')}>
                      <Ionicons name="md-image" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this._pickMedia(index, 'Videos')}>
                      <Ionicons name="ios-videocam" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => this.removeStep(index)}>
                      <Ionicons name="md-trash" size={25} color="#ffb52b" />
                    </TouchableOpacity>
                  </View>
                  {step.Videos && (
                    <VideoPlayer
                      ref={(component) => this.addRef}
                      source={{uri: step.Videos}}
                      rate={1.0}
                      volume={1.0}
                      resizeMode="cover"
                      disableVolume
                      disableBack
                      style={{margin: 10}}
                    />
                  )}
                  {step.Images && (
                    <View>
                      <Image
                        source={{uri: step.Images}}
                        style={{margin: 10, width: 200, height: 200}}
                      />
                      <TouchableOpacity
                        style={[styles.button, styles.corner]}
                        onPress={() => this.removeMedia(index, 'Images')}>
                        <Ionicons name="md-close" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {step.error && (
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 17,
                        color: '#ffb52b',
                      }}>
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
                      borderColor: '#ffb52b',
                      color: this.state.checked
                        ? step.step.length < 4
                          ? '#ffb52b'
                          : '#2274A5'
                        : '#2274A5',
                      width: width,
                      paddingLeft: 60,
                      paddingRight: 60,
                      margin: 10,
                      fontSize: 15,
                      textAlign: 'center',
                    }}
                  />
                </View>
              ))}
              <TouchableOpacity style={{padding: 10}} onPress={this.addStep}>
                <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                  <Ionicons
                    name="md-add-circle"
                    size={20}
                    style={{margin: 3}}
                    color="#2274A5"
                  />
                  <Text style={{color: '#2274A5', margin: 3}}>
                    Add New Step
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.handleSubmit}>
                <View
                  style={{
                    borderRadius: 20,
                    alignItems: 'center',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    backgroundColor: '#2274A5',
                    paddingRight: 5,
                    paddingLeft: 5,
                  }}>
                  <Ionicons
                    name="ios-send"
                    size={20}
                    color="#ffb52b"
                    style={{margin: 5}}
                  />
                  <Text style={{margin: 5, fontSize: 16, color: '#ffb52b'}}>
                    Update Tutorial
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.deletePost}>
                <Text
                  style={{padding: 10, color: '#e3242b', fontWeight: 'bold'}}>
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
    fontWeight: 'bold',
    margin: 10,
    color: '#2274A5',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  corner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    margin: 10,
  },
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#2274A5',
    borderRadius: 40,
    borderColor: 'white',
    margin: 5,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(UserPostScreen);
