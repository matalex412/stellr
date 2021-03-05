import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-picker';
import Modal from 'react-native-modal';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import Firebase from 'firebase';
import NetInfo from '@react-native-community/netinfo';

import NoInternet from './components/NoInternet';
import LinkSection from './components/LinkSection';
import ProfileBanner from './components/ProfileBanner';
import {firebase} from './../src/config';

const Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

export default class AccountScreen extends React.Component {
  state = {
    errorMessage: null,
    isLoading: true,
    user: {},
  };

  componentDidMount = () => {
    this.setup();
  };

  checkConnectivity = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({isConnected: state.isConnected});
    });
    unsubscribe();
  };

  setup = async () => {
    await this.checkConnectivity();

    // store current user data
    const {currentUser} = await firebase.auth();
    this.setState({currentUser});
    this.setState({isLoading: false});
  };

  editBio = async () => {
    await firebase
      .firestore()
      .collection('users')
      .doc(this.state.currentUser.uid)
      .update({
        bio: this.state.bio,
      });

    Alert.alert('Updated!', 'Your bio has been updated successfully');
  };

  verifyEmail = () => {
    this.state.currentUser.sendEmailVerification();
    Alert.alert(
      'Verification Email Sent',
      `An email has been sent to ${this.state.currentUser.email} to verify your account`,
    );
  };

  delete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {
          text: 'Yes',
          onPress: async () => {
            var currentUser = this.state.currentUser;

            try {
              // delete user data
              await currentUser.delete();
              await firebase
                .firestore()
                .collection('users')
                .doc(currentUser.uid)
                .delete();
            } catch (error) {
              // display any error
              this.setState({errorMessage: error.message});
            }
          },
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ],
    );
  };

  share = async () => {
    try {
      var options = {
        message:
          'Stellr is an Android learning platform to teach, learn and share skills',
        title: 'Check out Stellr',
        url: 'https://play.google.com/store/apps/details?id=com.iam.skoach',
      };
      const response = await Share.open(options);

      // update user's weekly stars
      firebase
        .firestore()
        .collection('users')
        .doc(this.state.currentUser.uid)
        .update({
          stars: Firebase.firestore.FieldValue.increment(5),
          weeklyStars: Firebase.firestore.FieldValue.increment(5),
        });
    } catch (err) {
      console.log(err);
    }
  };

  uploadImage(uri, mime = 'image/jpeg', refName) {
    return new Promise((resolve, reject) => {
      const {currentUser} = firebase.auth();
      const ref = firebase.storage().ref(refName);

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

  changeProfilePic = async () => {
    // get permissions
    try {
      var options = {
        mediaType: 'image',
        quality: 0.5,
        maxWidth: 100,
        maxHeight: 100,
      };

      ImagePicker.launchImageLibrary(options, async (result) => {
        if (!result.didCancel) {
          var {currentUser} = firebase.auth();

          // store profile pic and get route
          var refName = `users/${currentUser.uid}/profilePic`;
          var picture = await this.uploadImage(
            result.uri,
            'image/jpeg',
            refName,
          );

          await firebase
            .firestore()
            .collection('users')
            .doc(currentUser.uid)
            .update({
              profilePic: picture,
            });

          // update firebase auth profilePic
          await currentUser.updateProfile({
            photoURL: picture,
          });

          this.setState({currentUser});
        }
      });
    } catch (E) {
      console.log(E);
    }
  };

  setIg = () => {
    // update firebase
    firebase
      .firestore()
      .collection('users')
      .doc(this.state.currentUser.uid)
      .update({
        ig: this.state.ig,
      });

    // update bio
    var {user} = this.state;
    user.ig = this.state.ig;
    this.setState({user});
  };

  hideModal = () => {
    this.setState({isModalVisible: false});
  };

  showModal = async () => {
    var doc = await firebase
      .firestore()
      .collection('users')
      .doc(this.state.currentUser.uid)
      .get();
    var user = doc.data();
    this.setState({user});
    if (user.bio) {
      this.setState({bio: user.bio});
    }
    this.setState({isModalVisible: true});
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : this.state.isConnected ? (
          <View style={styles.subContainer}>
            <Modal isVisible={this.state.isModalVisible}>
              <TouchableOpacity onPress={this.hideModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={30}
                  color="#ffb52b"
                />
              </TouchableOpacity>
              <View style={styles.modalBox}>
                <ProfileBanner
                  imageStyle={styles.profileImageStyle}
                  viewStyle={{flexDirection: 'column'}}
                  user={this.state.user}
                  size={100}
                  onPress={this.changeProfilePic}
                />
                <View style={styles.centerRow}>
                  <View
                    style={{
                      alignItems: 'center',
                    }}>
                    <MaterialCommunityIcons
                      name="sack"
                      size={35}
                      color="#ffb52b"
                    />
                    <Text style={styles.minasText}>
                      {this.state.user.minas}
                    </Text>
                  </View>
                  <View style={styles.dot} />
                  <MaterialCommunityIcons
                    name="star"
                    size={30}
                    color="#ffb52b"
                  />
                  <Text style={styles.starsText}>{this.state.user.stars}</Text>
                </View>
                <View style={[styles.centerRow, {padding: 5}]}>
                  <TextInput
                    value={this.state.bio}
                    placeholder="Update Your Profile Bio"
                    onChangeText={(query) => this.setState({bio: query})}
                    multiline={true}
                    placeholderTextColor="white"
                    style={styles.bioBox}
                  />
                  <TouchableOpacity style={{padding: 5}} onPress={this.editBio}>
                    <MaterialCommunityIcons
                      name="send"
                      size={30}
                      color="#ffb52b"
                    />
                  </TouchableOpacity>
                </View>
                {this.state.user.ig ? (
                  <View style={styles.centerRow}>
                    <MaterialCommunityIcons
                      name="instagram"
                      size={30}
                      style={{marginRight: 20}}
                      color="#ffb52b"
                    />
                    <MaterialCommunityIcons
                      name="at"
                      size={20}
                      color="#ffb52b"
                    />
                    <Text style={styles.starsText}>{this.state.user.ig}</Text>
                  </View>
                ) : (
                  <View style={styles.centerRow}>
                    <MaterialCommunityIcons
                      name="at"
                      size={30}
                      color="#ffb52b"
                    />
                    <TextInput
                      value={this.state.ig}
                      placeholder="Add Instagram username"
                      onChangeText={(query) => this.setState({ig: query})}
                      maxLength={20}
                      style={styles.instaText}
                    />
                    <TouchableOpacity onPress={this.setIg} style={{padding: 5}}>
                      <MaterialCommunityIcons
                        name="send"
                        size={30}
                        color="#ffb52b"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Modal>
            <View style={styles.centerRow}>
              <TouchableOpacity
                style={{marginRight: 5, alignItems: 'center'}}
                onPress={this.showModal}>
                {this.state.currentUser.photoURL ? (
                  <Image
                    style={[styles.profilePic, styles.image]}
                    source={{uri: this.state.currentUser.photoURL}}
                  />
                ) : (
                  <View style={styles.profilePic}>
                    <MaterialCommunityIcons
                      name="account"
                      size={30}
                      color="#ffb52b"
                    />
                  </View>
                )}
                <Text style={[styles.text, {fontWeight: 'normal'}]}>Edit</Text>
              </TouchableOpacity>
              <View style={{alignItems: 'center'}}>
                <Text style={[styles.text, {fontWeight: 'normal'}]}>
                  <Text style={styles.text}>
                    {this.state.currentUser.displayName}
                  </Text>
                  's Account
                </Text>
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.text}>
                    {this.state.currentUser.email}
                  </Text>
                  {!this.state.currentUser.emailVerified && (
                    <TouchableOpacity onPress={this.verifyEmail}>
                      <Text style={styles.unverified}>(unverified email)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.leftContainer}>
              <LinkSection
                onPress={() => this.props.navigation.navigate('UserPosts')}
                text="Your Posts"
                icon="pencil"
              />
              <LinkSection
                onPress={() => this.props.navigation.navigate('History')}
                text="Learning History"
                icon="history"
              />
              <LinkSection
                onPress={() => firebase.auth().signOut()}
                text="Logout"
                icon="logout"
              />
              <LinkSection
                onPress={this.share}
                text="Share Skoach"
                icon="share"
              />
              <LinkSection
                onPress={this.delete}
                text="Delete Account"
                icon="delete"
                color="#e3242b"
              />
            </View>
            {this.state.errorMessage && (
              <Text style={styles.error}>{this.state.errorMessage}</Text>
            )}
          </View>
        ) : (
          <NoInternet refresh={this.setup} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  subContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    width: '80%',
    marginTop: 10,
    borderRadius: 5,
    elevation: 3,
  },
  modalBox: {
    borderRadius: 5,
    padding: 20,
    backgroundColor: '#fff',
  },
  minasText: {
    color: '#fff',
    bottom: 4,
    position: 'absolute',
  },
  starsText: {fontSize: 20, color: '#ffb52b'},
  bioBox: {
    backgroundColor: '#bcd4e6',
    textAlign: 'center',
    borderRadius: 5,
    padding: 5,
    width: 200,
  },
  instaText: {
    textAlign: 'left',
    color: '#ffb52b',
    padding: 5,
    backgroundColor: 'white',
  },
  image: {
    width: 50,
    height: 50,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffb52b',
    marginLeft: 5,
    marginRight: 5,
  },
  profilePic: {
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  text: {
    fontSize: 15,
    color: '#2274A5',
    fontWeight: 'bold',
  },
  profileImageStyle: {
    marginRight: 0,
    marginBottom: 5,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  centerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  unverified: {color: '#e3242b', fontWeight: 'bold'},
  leftContainer: {justifyContent: 'center', alignItems: 'flex-start'},
  error: {marginLeft: 50, marginRight: 50, color: 'black'},
});
