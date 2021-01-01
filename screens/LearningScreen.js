import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import {AdMobBanner, AdMobInterstitial} from 'react-native-admob';
import Firebase from 'firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AirbnbRating} from 'react-native-ratings';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Carousel from 'react-native-snap-carousel';
import {human, systemWeights} from 'react-native-typography';
import VideoPlayer from 'react-native-video-controls';

import ProfileBanner from './components/ProfileBanner';
import Step from './components/Step';
import ModalAlert from './components/ModalAlert';
import Background from './components/Background';
import CustomLoading from './components/CustomLoading';
import LearnModal from './components/LearnModal';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class LearningScreen extends React.Component {
  state = {
    paid: true,
    isLoading: true,
    posts: {},
    activeIndex: 0,
    isModalVisible: false,
    minas: 0,
  };

  componentDidMount = () => {
    this.vids = [];
    this.setup();
  };

  setup = async () => {
    // get currentuser and post data
    const {currentUser} = firebase.auth();
    const postInfo = this.props.tutorials.added;

    if (!currentUser.isAnonymous) {
      var doc = await firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();
      this.setState({minas: doc.data().minas});
    }

    // get tutorial
    var doc = await firebase
      .firestore()
      .collection(`${postInfo.topic}/posts`)
      .doc(this.props.tutorials.learn_key)
      .get();

    /*  if (!currentUser.isAnonymous) {
      // check if user has bookmarked tutorial
      var ids;
      var doc2 = await firebase
        .firestore()
        .collection('users/' + currentUser.uid + '/data')
        .doc('learning')
        .get();

      if (doc2.exists) {
        ids = Object.keys(doc2.data());
        if (ids.includes(this.props.tutorials.learn_key)) {
          this.setState({added: true});
          this.setState({paid: true});
        }
      }
    }*/
    this.setState({currentUser});

    // check if post exists
    if (!doc.exists) {
      // redirect user
      this.setState({alertIcon: 'md-close'});
      this.setState({alertTitle: 'Tutorial Moved'});
      this.setState({
        alertMessage:
          'Sorry, this tutorial has either been deleted or its topic has been changed',
      });
      this.setState({isModalVisible: true});

      if (this.state.added) {
        // remove post from learning object for user
        var postRef = firebase
          .firestore()
          .collection(`users/${currentUser.uid}/data`)
          .doc('learning');
        postRef.update({
          [this.props.tutorials
            .learn_key]: Firebase.firestore.FieldValue.delete(),
        });
      }
    } else {
      var post = doc.data();
      if (post.topic == '/topics/Meta') {
        this.setState({paid: true});
      }

      this.setState({currentUser});
      this.setState({post});
      this.setState({isLoading: false});

      if (this.state.added) {
        // TEST THIS
        const update = {};
        update[`${this.props.tutorials.learn_key}.thumbnail`] = post.thumbnail;

        // update thumbnail if changed
        if (post.thumbnail != postInfo.thumbnail) {
          firebase
            .firestore()
            .collection(`users/${currentUser.uid}/data`)
            .doc('learning')
            .update(update);
        }
      }
    }

    var doc0 = await firebase
      .firestore()
      .collection('users')
      .doc(post.uid)
      .get();
    var data = doc0.data();
    var creatorProfile = {
      profilePic: data.profilePic,
      username: data.username,
    };
    this.setState({creatorProfile});

    // Display an interstitial
    //    AdMobInterstitial.setAdUnitID('ca-app-pub-3800661518525298/2568980529');
    //  AdMobInterstitial.requestAd();
  };

  changeModalVisibility = (visible) => {
    this.setState({isModalVisible: visible});
  };

  /* learnt = async (rating, complete, added) => {
    const {currentUser} = firebase.auth();

    if (added) {
      // remove post from learning object for user
      var postRef = firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('learning');
      postRef.update({
        [this.props.tutorials
          .learn_key]: Firebase.firestore.FieldValue.delete(),
      });
    }

    if (!currentUser.isAnonymous) {
      var alreadyLearnt = false;
      // get users history
      var doc = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('history')
        .get();

      var historyRef = await firebase
        .firestore()
        .collection(`users/${currentUser.uid}/data`)
        .doc('history');

      // check if tutorial has previously been learnt by user
      if (doc.exists) {
        var learnt = doc.data();
        var keys = Object.keys(learnt);
        for (key of keys) {
          if (key == this.props.tutorials.learn_key) {
            var alreadyLearnt = true;
            var data = learnt[key];
          }
        }
      }

      if (alreadyLearnt == true) {
        data.time = Date.now();
        data.complete = complete;
        historyRef.update({
          [this.props.tutorials.learn_key]: data,
        });
      } else {
        // add to learning history
        historyRef.set(
          {
            [this.props.tutorials.learn_key]: {
              topic: this.props.tutorials.added.topic,
              title: this.state.post.title,
              thumbnail: this.props.tutorials.added.thumbnail,
              time: Date.now(),
              complete: complete,
            },
          },
          {merge: true},
        );
      }
    }

    if (complete) {
      var field = 'learns';
    } else {
      var field = 'incomplete';
    }

    if (!alreadyLearnt) {
      // update tutorial stats
      await firebase
        .firestore()
        .collection(`${this.props.tutorials.added.topic}/posts`)
        .doc(this.props.tutorials.learn_key)
        .update({
          stars: Firebase.firestore.FieldValue.increment(rating),
          [field]: Firebase.firestore.FieldValue.increment(1),
        });

      // update current user stats
      await firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          stars: Firebase.firestore.FieldValue.increment(1),
          weeklyStars: Firebase.firestore.FieldValue.increment(1),
        });
    }

    // update creator's stars
    await firebase
      .firestore()
      .collection('users')
      .doc(this.state.post.uid)
      .update({
        stars: Firebase.firestore.FieldValue.increment(rating),
        weeklyStars: Firebase.firestore.FieldValue.increment(rating),
      });

    this.setState({isModalVisible: false});
    this.props.navigation.navigate('Home');
  };

  /* addHome = async () => {
    const {currentUser} = await firebase.auth();

    // add tutorial to user's learning section
    await firebase
      .firestore()
      .collection(`users/${currentUser.uid}/data`)
      .doc('learning')
      .set(
        {
          [this.props.tutorials.learn_key]: {
            topic: this.props.tutorials.added.topic,
            title: this.state.post.title,
            thumbnail: this.props.tutorials.added.thumbnail,
          },
        },
        {merge: true},
      );

    // redirect user
    this.setState({alertIcon: 'md-add-circle'});
    this.setState({alertTitle: 'Added'});
    this.setState({
      alertMessage: `The tutorial "${this.state.post.title}" has been added to your home page`,
    });
    this.setState({isModalVisible: true});

    this.setState({added: true});
  };*/

  _onPlaybackStatusUpdate = (playbackStatus, index) => {
    if (playbackStatus.didJustFinish) {
      this.vids[index].setStatusAsync({shouldPlay: false, positionMillis: 0});
    }
  };

  /* buy = async (ad) => {
    var {currentUser} = await firebase.auth();

    if (ad) {
      //    AdMobInterstitial.showAd();
      this.setState({paid: true});

      if (currentUser.uid != this.state.post.uid) {
        firebase
          .firestore()
          .collection('users')
          .doc(this.state.post.uid)
          .update({
            minas: Firebase.firestore.FieldValue.increment(5),
          });
      }
    } else if (!currentUser.isAnonymous) {
      var userRef = firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid);

      firebase.firestore().runTransaction((transaction) => {
        return transaction.get(userRef).then((doc) => {
          var minas = doc.data().minas - 5;
          if (minas >= 0) {
            transaction.update(userRef, {minas});
            firebase
              .firestore()
              .collection('users')
              .doc(this.state.post.uid)
              .update({
                minas: Firebase.firestore.FieldValue.increment(5),
              });
            this.setState({paid: true});
          } else {
            // redirect user
            this.setState({alertIcon: 'md-cash'});
            this.setState({alertTitle: 'Earn Minas'});
            this.setState({
              alertMessage:
                "Sorry, you don't have enough Minas right now. You can earn them by creating tutorials",
            });
            this.setState({isModalVisible: true});
          }
        });
      });
    } else {
      // redirect user
      this.setState({alertIcon: 'md-cash'});
      this.setState({alertTitle: 'Earn Minas'});
      this.setState({
        alertMessage:
          "Sorry, you don't have enough Minas right now. You can earn them by creating tutorials (account needed)",
      });
      this.setState({isModalVisible: true});
    }
  };*/

  _renderItem = ({item, index}) => {
    var width = Dimensions.get('window').width;
    return <Step key={index} index={index} item={item} width={width} />;
  };

  render() {
    var width = Dimensions.get('window').width;
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Background />
        <ModalAlert
          title={this.state.alertTitle}
          message={this.state.alertMessage}
          isModalVisible={this.state.isModalVisible}
          onDismiss={() => this.changeModalVisibility(false)}
          icon={this.state.alertIcon}
        />
        {this.state.isLoading ? (
          <CustomLoading verse="Do you see a man skilled in his work? He will stand before kings" />
        ) : (
          <View>
            <View style={{minHeight: 50, alignItems: 'center'}}>
              <AdMobBanner
                adSize="smartBanner"
                adUnitID="ca-app-pub-3800661518525298/6229842172"
                onAdFailedtoLoad={() => console.log('banner ad not loading')}
              />
            </View>
            <View
              style={{
                width: width,
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 10,
              }}>
              {this.state.paid ? null : (
                <View
                  style={{
                    alignItems: 'center',
                    top: 5,
                    right: 20,
                    position: 'absolute',
                  }}>
                  <MaterialCommunityIcons
                    name="sack"
                    size={30}
                    color="#ffb52b"
                  />
                  <Text
                    style={{
                      color: 'white',
                      top: 10,
                      position: 'absolute',
                    }}>
                    {this.state.minas}
                  </Text>
                </View>
              )}

              <Text style={styles.title}>{this.state.post.title}</Text>
              {/*<Text style={{color: '#2274A5'}}>
                by {this.state.post.username}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  padding: 5,
                  alignItems: 'center',
                }}>
                <Text
                  style={[human.callout, {color: '#2274A5', marginRight: 10}]}>
                  Learns: {this.state.post.learns - this.state.post.incomplete}
                </Text>
                <AirbnbRating
                  isDisabled
                  defaultRating={
                    this.state.post.stars /
                    (this.state.post.learns + this.state.post.incomplete)
                  }
                  selectedColor="#ffb52b"
                  showRating={false}
                  type="custom"
                  size={20}
                  useNativeDriver={true}
                />
              </View>
              {this.state.post.info ? (
                <Text
                  style={[
                    human.callout,
                    {
                      color: '#2274A5',
                      marginHorizontal: 40,
                      marginVertical: 10,
                      textAlign: 'center',
                    },
                  ]}>
                  {this.state.post.info}
                </Text>
              ) : null}*/}

              {!this.state.paid ? (
                <View style={{margin: 15, flexDirection: 'row'}}>
                  <TouchableOpacity
                    onPress={() => this.buy(false)}
                    style={[
                      styles.button,
                      {paddingVertical: 0, marginRight: 5},
                    ]}>
                    <MaterialCommunityIcons
                      name="cash-usd"
                      size={40}
                      color="#ffb52b"
                    />
                    <Text style={{color: 'white'}}> Use 5 Minas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.buy(true)}
                    style={[styles.button, {paddingTop: 0, paddingBottom: 0}]}>
                    <Ionicons name="md-play-circle" size={25} color="#ffb52b" />
                    <Text style={{color: 'white'}}> Play ad </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{alignItems: 'center'}}>
                  <View style={styles.pagination}>
                    <Text style={{color: '#fff'}}>
                      {this.state.activeIndex + 1}/
                      {this.state.post.steps.length}
                    </Text>
                  </View>
                  <Carousel
                    layout={'default'}
                    ref={(ref) => (this.carousel = ref)}
                    data={this.state.post.steps}
                    sliderWidth={width}
                    itemWidth={width}
                    renderItem={this._renderItem}
                    onSnapToItem={(index) =>
                      this.setState({activeIndex: index})
                    }
                    containerCustomStyle={{
                      flexGrow: 0,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      borderTopWidth: 1,
                      borderColor: 'lightgray',
                      width: width,
                      justifyContent: 'space-evenly',
                      padding: 10,
                      alignItems: 'center',
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Ionicons
                        name="md-eye"
                        size={25}
                        color="#2274A5"
                        style={{marginRight: 3}}
                      />
                      <Text>
                        {this.state.post.learns + this.state.post.incomplete}
                      </Text>
                    </View>
                    <AirbnbRating
                      onFinishRating={(rating) => this.setState({rating})}
                      selectedColor="#ffb52b"
                      showRating={false}
                      type="custom"
                      size={20}
                    />
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Ionicons
                        name="md-star"
                        size={25}
                        color="#2274A5"
                        style={{marginRight: 3}}
                      />
                      <Text>
                        {(
                          this.state.post.stars /
                          (this.state.post.learns + this.state.post.incomplete)
                        ).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  {this.state.creatorProfile && (
                    <ProfileBanner
                      imageStyle={{
                        width: 40,
                        height: 40,
                      }}
                      font={22}
                      user={this.state.creatorProfile}
                      viewStyle={{
                        borderWidth: 1,
                        borderColor: 'lightgray',
                        width: width,
                        justifyContent: 'center',
                      }}
                      size={32}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  heading: {
    ...human.headlineObject,
    ...systemWeights.semibold,
    color: '#2274A5',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    ...human.title2Object,
    ...systemWeights.light,
    fontStyle: 'italic',
    color: '#2274A5',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#2274A5',
    elevation: 1,
    padding: 7,
    borderRadius: 2,
  },
  pagination: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 20,
    padding: 3,
    backgroundColor: '#2275A5',
    zIndex: 999,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LearningScreen);
