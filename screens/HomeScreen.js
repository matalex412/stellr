import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Firebase from 'firebase';
import {AdMobBanner} from 'react-native-admob';
import {human, systemWeights} from 'react-native-typography';

import Background from './components/Background';
import ModalAlert from './components/ModalAlert';
import CustomLoading from './components/CustomLoading';
import {updateTutorials} from './../redux/actions';
import {store} from './../redux/store';
import {firebase} from './../src/config';

class HomeScreen extends React.Component {
  state = {
    currentUser: null,
    isLoading: true,
    posts: {},
    keys: [],
    isModalVisible: false,
  };

  componentDidMount = () => {
    this.setup();
  };

  componentWillUnmount = () => {
    // turn off tutorial listener
    var learnRef = this.state.learnRef;
    if (learnRef) {
      learnRef();
    }
  };

  changeModalVisibility = (visible) => {
    this.setState({isModalVisible: visible});
  };

  shuffle = (array) => {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  setup = async () => {
    this.setState({isLoading: true});
    var {currentUser} = await firebase.auth();
    if (this.props.tutorials.newAccount) {
      this.setState({alertTitle: 'Welcome!'});
      this.setState({
        alertMessage: `Hi and welcome to Skoach! To get started, why not try out the "Using Skoach" tutorials on the "Added" page`,
      });
      this.changeModalVisibility(true);
      store.dispatch(updateTutorials({newAccount: false}));
    }

    if (!currentUser) {
      // sign user in
      await firebase
        .auth()
        .signInAnonymously()
        .catch((err) => {
          console.log(err.message);
        });

      // get new currentUser info
      currentUser = await firebase.auth().currentUser;
    }

    this.getPosts();

    // check user is verified
    if (currentUser.isVerified) {
      // get user's messages
      var doc = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('messages')
        .get();
      if (doc.exists) {
        var messages = doc.data();

        if (messages['Please verify your email']) {
          firebase
            .firestore()
            .collection(`users/${currentUser.uid}/data`)
            .doc('messages')
            .update({
              'Please verify your email': Firebase.firestore.FieldValue.delete(),
            });
        }
      }
    }
  };

  getPosts = async () => {
    this.setState({isLoading: true});
    var {currentUser} = await firebase.auth();

    // get user's interests
    if (!currentUser.isAnonymous) {
      var doc = await firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();
      if (doc.exists) {
        var data = doc.data();
        var interests = data.interests;
      } else {
        var interests = {
          creators: ['4CRlxvD9rpZB3ASqJriEwEJbDQ92'],
          topics: ['/topics/Meta', '/topics/Art'],
        };
      }
    } else if (currentUser.isAnonymous) {
      var interests = {
        creators: ['4CRlxvD9rpZB3ASqJriEwEJbDQ92'],
        topics: ['/topics/Meta', '/topics/Art'],
      };
    }
    // fetch tutorials related to user's interests
    var creator,
      doc,
      docs,
      post,
      posts = [];

    if (interests.topics.length > 0) {
      var x = Math.ceil(5 / interests.creators.length);
    }

    for (creator of interests.creators) {
      docs = await firebase
        .firestore()
        .collectionGroup('posts')
        .where('uid', '==', creator)
        .limit(x)
        .get();
      docs.forEach((doc) => {
        post = doc.data();
        post.key = doc.id;
        posts.push(post);
      });
    }

    if (interests.topics.length > 0) {
      var y = Math.ceil(5 / interests.topics.length);
    }

    for (var topic of interests.topics) {
      docs = await firebase
        .firestore()
        .collectionGroup('posts')
        .where('topic', '==', topic)
        .limit(y)
        .get();
      docs.forEach((doc) => {
        post = doc.data();
        post.key = doc.id;

        if (!posts.some((p) => p.key == post.key)) {
          posts.push(post);
        }
      });
    }
    posts = this.shuffle(posts);

    this.setState({posts});
    this.setState({isLoading: false});
  };

  handlePress = async (post) => {
    // store clicked post and go to tutorial page
    await store.dispatch(updateTutorials({current_key: post.key}));
    await store.dispatch(updateTutorials({current: post}));
    this.props.navigation.navigate('Tutorial');
  };

  render() {
    var width = Dimensions.get('window').width;
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={this.getPosts} />
          }>
          <Background />
          <ModalAlert
            title={this.state.alertTitle}
            message={this.state.alertMessage}
            isModalVisible={this.state.isModalVisible}
            onDismiss={() => this.changeModalVisibility(false)}
          />
          {this.state.isLoading ? (
            <CustomLoading
              color="#2274A5"
              verse="Do you see a man skilled in his work? He will stand before kings"
            />
          ) : (
            <View>
              <View style={{alignItems: 'center', marginBottom: 5}}>
                <AdMobBanner
                  adSize="smartBanner"
                  adUnitID="ca-app-pub-3800661518525298/6229842172"
                  onAdFailedtoLoad={() => console.log('banner ad not loading')}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginBottom: 15,
                }}>
                {this.state.posts.map((image, index) => {
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => this.handlePress(image)}
                      style={{
                        margin: 5,
                        backgroundColor: 'white',
                        elevation: 5,
                        borderRadius: 5,
                      }}>
                      <Image
                        resizeMode={'cover'}
                        style={{
                          width: width / 2 - 20,
                          height: 200,
                          borderTopLeftRadius: 5,
                          borderTopRightRadius: 5,
                        }}
                        source={{uri: image.thumbnail}}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          human.subhead,
                          systemWeights.semibold,
                          {
                            padding: 5,
                            textAlign: 'center',
                            marginTop: 3,
                            color: '#2274A5',
                            width: width / 2 - 20,
                          },
                        ]}>
                        {image.title}
                      </Text>
                    </TouchableOpacity>
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
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  button: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 35,
    height: 35,
    backgroundColor: 'white',
    borderRadius: 35,
    margin: 5,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(HomeScreen);
