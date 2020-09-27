import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-picker';
import Modal from 'react-native-modal';

import Background from './components/Background';
import LinkSection from './components/LinkSection';
import ProfileBanner from './components/ProfileBanner';
import {firebase} from './../src/config';

export default class AccountScreen extends React.Component {
  state = {
    errorMessage: null,
    isLoading: true,
    user: {},
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
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
    // let user share app website
    await Share.share({
      message: 'http://matthewalex.com/skoach',
    });
  };

  changeProfilePic = async () => {
    // get permissions
    try {
      var options = {mediaType: 'image', tintColor: '#fff'};

      ImagePicker.launchImageLibrary(options, async (result) => {
        if (!result.didCancel) {
          var {currentUser} = firebase.auth();

          // store thumbnail and get route
          const response = await fetch(result.uri);
          const blob = await response.blob();
          var ref = await firebase
            .storage()
            .ref()
            .child(`users/${currentUser.uid}/profilePic`);
          await ref.put(blob);
          var picture = await ref.getDownloadURL();

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

  render() {
    return (
      <View style={styles.container}>
        <Background />
        {this.state.isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: 'white',
              padding: 20,
              width: '70%',
              marginTop: 10,
              borderRadius: 5,
              elevation: 1,
            }}>
            <Modal isVisible={this.state.isModalVisible}>
              <TouchableOpacity
                onPress={() => this.setState({isModalVisible: false})}>
                <MaterialCommunityIcons
                  name="close"
                  size={30}
                  color="#ffb52b"
                />
              </TouchableOpacity>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                }}>
                <View
                  style={{
                    borderRadius: 5,
                    padding: 20,
                    backgroundColor: '#fff',
                  }}>
                  <ProfileBanner
                    imageStyle={{
                      marginRight: 0,
                      marginBottom: 5,
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                    }}
                    viewStyle={{flexDirection: 'column'}}
                    user={this.state.user}
                    size={100}
                    onPress={this.changeProfilePic}
                  />
                  <View
                    style={{
                      justifyContent: 'center',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        alignItems: 'center',
                      }}>
                      <MaterialCommunityIcons
                        name="sack"
                        size={30}
                        color="#ffb52b"
                      />
                      <Text
                        style={{
                          color: '#fff',
                          top: 10,
                          position: 'absolute',
                        }}>
                        {this.state.user.minas}
                      </Text>
                    </View>
                    <View style={styles.dot} />
                    <MaterialCommunityIcons
                      name="star"
                      size={30}
                      color="#ffb52b"
                    />
                    <Text>{this.state.user.stars}</Text>
                  </View>
                  <View
                    style={{
                      padding: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}>
                    <TextInput
                      value={this.state.bio}
                      placeholder="Update Your Profile Bio"
                      onChangeText={(query) => this.setState({bio: query})}
                      multiline={true}
                      style={{
                        textAlign: 'center',
                        borderRadius: 5,
                        color: 'black',
                        padding: 5,
                        width: 200,
                      }}
                    />
                    <TouchableOpacity
                      style={{padding: 5}}
                      onPress={this.editBio}>
                      <MaterialCommunityIcons
                        name="send"
                        size={30}
                        color="#ffb52b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <TouchableOpacity
                style={{marginRight: 5}}
                onPress={async () => {
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
                }}>
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
                <Text
                  style={{textAlign: 'center', fontSize: 12, color: '#2274A5'}}>
                  Edit
                </Text>
              </TouchableOpacity>
              <View style={{alignItems: 'center'}}>
                <Text style={{color: '#2274A5'}}>
                  <Text style={{color: '#2274A5', fontWeight: 'bold'}}>
                    {this.state.currentUser.displayName}
                  </Text>
                  's Account
                </Text>
                <View style={{alignItems: 'center'}}>
                  <Text style={{color: '#2274A5', fontWeight: 'bold'}}>
                    {this.state.currentUser.email}
                  </Text>
                  {!this.state.currentUser.emailVerified && (
                    <TouchableOpacity onPress={this.verifyEmail}>
                      <Text style={{color: '#e3242b', fontWeight: 'bold'}}>
                        (unverified email)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'flex-start'}}>
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
              <Text style={{marginLeft: 50, marginRight: 50, color: 'black'}}>
                {this.state.errorMessage}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 30,
    height: 30,
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
});
