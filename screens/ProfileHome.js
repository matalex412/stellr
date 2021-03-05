import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomLoading from './components/CustomLoading';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';
import TutorialCover from './components/TutorialCover';
import ProfileBanner from './components/ProfileBanner';

class ProfileHome extends React.Component {
  state = {
    topics: {},
    isLoading: true,
  };

  componentDidMount = () => {
    this.updateProfilePic;
    this.setup();
  };

  updateProfilePic = async () => {
    // get friends data from firestore
    var {currentUser} = await firebase.auth();
    var doc = await firebase
      .firestore()
      .collection('users')
      .doc(this.props.tutorials.profile.uid)
      .get();
    var data = doc.data();

    // check if friends data has changed
    if (data.profilePic != this.props.tutorials.profile.profilePic) {
      var update = {...this.props.tutorials.profile};
      update.profilePic = data.profilePic;

      delete update['uid'];
      await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('people')
        .update({
          [this.props.tutorials.profile.uid]: update,
        });

      update.uid = this.props.tutorials.profile.uid;
      await store.dispatch(updateTutorials({profile: update}));
    }
  };

  setup = async () => {
    // get profile data from firestore
    var doc = await firebase
      .firestore()
      .collection('users')
      .doc(this.props.tutorials.profile.uid)
      .get();
    var data = doc.data();
    await this.setState({user: data});

    // format topics of interest
    var topics = {};
    for (var topic of data.interests.topics) {
      var name = topic.split('/topics/').pop();
      var icon = await firebase
        .database()
        .ref(`categories/${name}/icon`)
        .once('value');
      if (icon != null) {
        topics[name] = icon.toJSON();
      }
    }
    await this.setState({topics});

    // get users most popular post
    var doc2 = await firebase
      .firestore()
      .collectionGroup('posts')
      .where('username', '==', this.props.tutorials.profile.username)
      .orderBy('learns', 'desc')
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const user = querySnapshot.docs[0].data();
          const key = querySnapshot.docs[0].id;
          this.setState({popular: user});
          this.setState({key});
        }
      });

    this.setState({isLoading: false});
  };

  handlePress = async () => {
    // send user to tutorial screen
    await store.dispatch(
      updateTutorials({tutorial_topic: this.state.popular.topic}),
    );
    await store.dispatch(updateTutorials({current: this.state.popular}));
    await store.dispatch(updateTutorials({current_key: this.state.key}));
    //   this.props.navigation.navigate("AuthStack", { screen: "Login" });

    this.props.navigation.navigate('ProfileTabs', {screen: 'Home'});
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <CustomLoading verse="Love is patient, love is kind" />
          ) : (
            <View style={{width: '100%', alignItems: 'center'}}>
              <ProfileBanner
                imageStyle={{width: 100, height: 100, borderRadius: 5}}
                bio={this.state.user.bio}
                user={this.state.user}
                size={100}
              />
              {this.state.popular && (
                <View style={{padding: 10}}>
                  <Text style={styles.heading}>Most Popular Tutorial</Text>
                  <TutorialCover
                    tutorial={this.state.popular}
                    onPress={this.handlePress}
                  />
                </View>
              )}
              <Text style={styles.heading}>Interests</Text>
              <View
                style={{
                  justifyContent: 'center',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                {Object.keys(this.state.topics).map((topic, index) => {
                  return (
                    <View style={styles.square} key={index}>
                      <MaterialCommunityIcons
                        name={this.state.topics[topic]}
                        size={40}
                        color="#ffb52b"
                      />
                      <View>
                        <Text style={styles.text}>{topic}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    textAlign: 'center',
    color: '#ffb52b',
    fontSize: 15,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  heading: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2274A5',
  },
  square: {
    margin: 10,
    width: Dimensions.get('window').width / 3 - 30,
    height: Dimensions.get('window').width / 3 - 30,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(ProfileHome);
