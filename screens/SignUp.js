import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {human, systemWeights} from 'react-native-typography';
import LinearGradient from 'react-native-linear-gradient';

import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class SignUp extends React.Component {
  state = {
    email: '',
    password: '',
    username: '',
    errorMessage: null,
    isLoading: false,
    isPasswordHidden: true,
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    // get array of taken usernames
    var names = await firebase.database().ref('names').once('value');
    names = names.toJSON();
    if (names == null) {
      names = [];
    } else {
      names = Object.values(names);
    }

    this.setState({names});
  };

  handleSignUp = async () => {
    await this.setState({isLoading: true});
    this.setState({errorMessage: null});
    if (
      this.state.email.length > 1 &&
      this.state.password.length > 1 &&
      this.state.username.length > 1
    ) {
      try {
        var names = this.state.names;
        var unique = true;
        var name;

        // check display name is unique
        if (names.includes(this.state.username)) {
          unique = false;
        }

        if (unique) {
          // create user
          await firebase
            .auth()
            .createUserWithEmailAndPassword(
              this.state.email,
              this.state.password,
            );

          await store.dispatch(updateTutorials({newAccount: true}));

          var user = await firebase.auth().currentUser;

          // update username
          await user.updateProfile({
            displayName: this.state.username,
          });

          var interests = {};
          interests.creators = ['4CRlxvD9rpZB3ASqJriEwEJbDQ92'];
          interests.topics = ['/topics/Meta', '/topics/Art'];

          // create base user data in firestore firestore
          var lower = this.state.username.toLowerCase();
          lower = lower.trim();
          await firebase.firestore().collection('users/').doc(user.uid).set({
            lowercaseName: lower,
            username: this.state.username,
            interests: interests,
            minas: 15,
          });

          // add help tutorials to user screen
          await firebase
            .firestore()
            .collection('users/' + user.uid + '/data')
            .doc('learning')
            .set({
              '2fJyrGMwyU8bKKImOtb2': {
                title: 'Using Stellr',
                thumbnail:
                  'https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/topics%2FMeta%2F2fJyrGMwyU8bKKImOtb2%2FThumbnail?alt=media&token=59e43224-67f6-49ec-8e74-e15688a4c9f5',
                topic: 'topics/Meta',
              },
              iuyEJIBF63QJRhcBNNQ6: {
                title: 'Creating a Tutorial',
                thumbnail:
                  'https://firebasestorage.googleapis.com/v0/b/skoach-7d39b.appspot.com/o/topics%2FMeta%2FiuyEJIBF63QJRhcBNNQ6%2FThumbnail?alt=media&token=e503408c-ec05-4409-8110-a761aceadc26',
                topic: 'topics/Meta',
              },
            });

          // send user message to verify email
          await firebase
            .firestore()
            .collection('users/' + user.uid + '/data')
            .doc('messages')
            .set({
              [Date.now()]: {
                message: 'Please verify your email',
                status: 'unread',
              },
            });
          await store.dispatch(updateTutorials({unread: true}));

          // update list of taken usernames
          names.push(this.state.username);
          firebase.database().ref('/').update({names: names});

          // send user email verification
          user.sendEmailVerification();
        } else {
          this.setState({
            errorMessage: 'Sorry, that username has been taken',
          });
        }
      } catch (error) {
        // create error message
        var message;
        switch (error.code) {
          case 'auth/invalid-email':
            message = "That doesn't seem like a valid email address";
            break;
          case 'auth/email-already-in-use':
            message = 'Another account already uses that email address';
            break;
          case 'auth/weak-password':
            message = "Sorry, that password isn't strong enough";
            break;
          case 'auth/too-many-requests':
            message = 'Too many tries to sign up. Try again later';
          default:
            message = 'Sorry, something went wrong';
        }

        // display errors
        this.setState({errorMessage: message});
      }
    } else {
      setTimeout(() => {
        this.setState({
          errorMessage: "You haven't filled all the fields yet",
        });
      }, 500);
    }
    this.setState({isLoading: false});
  };

  render() {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#2274A5', '#fff']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '100%',
          }}
        />
        <Text style={[human.title1, systemWeights.bold, {color: '#fff'}]}>
          Sign Up
        </Text>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 20,
            width: '80%',
            marginTop: 10,
            borderRadius: 5,
            elevation: 3,
          }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}>
            <View
              style={{
                paddingTop: 2,
                alignItems: 'center',
                width: 25,
                height: 25,
              }}>
              <Ionicons name="md-person" size={25} color="#2274A5" />
            </View>
            <TextInput
              placeholder="Username"
              autoCapitalize="none"
              style={styles.textInput}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
            />
          </View>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <View style={{alignItems: 'center', width: 25, height: 25}}>
              <Ionicons name="md-mail" size={25} color="#2274A5" />
            </View>
            <TextInput
              keyboardType="email-address"
              placeholder="Email"
              autoCapitalize="none"
              style={styles.textInput}
              onChangeText={(email) => this.setState({email})}
              value={this.state.email}
            />
          </View>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <View style={{alignItems: 'center', width: 25, height: 25}}>
              <Ionicons name="lock-closed" size={25} color="#2274A5" />
            </View>
            <TextInput
              secureTextEntry={this.state.isPasswordHidden}
              placeholder="Password"
              autoCapitalize="none"
              style={styles.textInput}
              onChangeText={(password) => this.setState({password})}
              value={this.state.password}
            />
            <TouchableOpacity
              style={{position: 'absolute', right: 5}}
              onPress={() =>
                this.setState({
                  isPasswordHidden: !this.state.isPasswordHidden,
                })
              }>
              <Ionicons
                name={this.state.isPasswordHidden ? 'md-eye' : 'md-eye-off'}
                size={25}
                color="#2274A5"
              />
            </TouchableOpacity>
          </View>
          {!this.state.isLoading ? (
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.5}
              onPress={this.handleSignUp}>
              <Text style={{color: 'white', fontSize: 20}}>Sign Up</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.submitButton}>
              <ActivityIndicator color="white" />
            </View>
          )}
        </View>
        {this.state.errorMessage ? (
          <Text
            style={[
              human.footnote,
              {padding: 5, color: '#e3242b', ...systemWeights.bold},
            ]}>
            {this.state.errorMessage}
          </Text>
        ) : (
          <Text
            style={[
              human.footnote,
              {padding: 5, color: '#e3242b', ...systemWeights.bold},
            ]}>
            {'  '}
          </Text>
        )}
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          <TouchableOpacity
            style={{
              marginHorizontal: 5,
              padding: 4,
              backgroundColor: 'white',
              borderRadius: 4,
              elevation: 3,
            }}
            onPress={() => this.props.navigation.navigate('Login')}>
            <Text style={{color: '#2274A5'}}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginHorizontal: 5,
              padding: 4,
              backgroundColor: 'white',
              borderRadius: 4,
              elevation: 3,
            }}
            onPress={() => this.props.navigation.navigate('App')}>
            <Text style={{color: '#2274A5'}}>Continue Anonymously</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    height: 28,
    justifyContent: 'center',
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#ffb52b',
    borderRadius: 2,
  },
  textInput: {
    padding: 2,
    fontSize: 18,
    width: '80%',
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#2274A5',
    color: '#2274A5',
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(SignUp);
