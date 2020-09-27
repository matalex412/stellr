import React from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import {firebase} from './../src/config';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import {AdMobBanner} from 'react-native-admob';

import Background from './components/Background';
import ProfileBanner from './components/ProfileBanner';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import CustomLoading from './components/CustomLoading';

class LeaderboardScreen extends React.Component {
  state = {
    users: [],
    isLoading: true,
    showLeaderboard: false,
    current: {},
  };

  componentDidMount = () => {
    this.setup();
  };

  clickedUser = async (user) => {
    await store.dispatch(updateTutorials({profile: user}));
    this.props.navigation.navigate('Profile');
  };

  setup = async () => {
    var {currentUser} = await firebase.auth();

    var docs = await firebase
      .firestore()
      .collection('users')
      .orderBy('weeklyStars', 'desc')
      .limit(5)
      .get();

    var user,
      users = [];
    docs.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
      users.push(user);
    });

    // check day so leaderboard is only displayed on sunday
    var d = new Date().getDay();
    if (d == 0) {
      this.setState({showLeaderboard: true});
    }

    if (!currentUser.isAnonymous) {
      var doc2 = await firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      var current = doc2.data();
      current.uid = doc2.id;
      this.setState({current});
    } else {
      await this.setState({isAnonymous: true});
    }

    this.setState({users});
    this.setState({isLoading: false});
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Background />
        {this.state.isLoading ? (
          <CustomLoading verse="I can do all things through him who strengthens me" />
        ) : (
          <View
            style={{
              width: '100%',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <View
              style={{marginVertical: 5, minHeight: 50, alignItems: 'center'}}>
              <AdMobBanner
                adUnitID="ca-app-pub-3262091936426324/7558442816"
                onDidFailToReceiveAdWithError={() =>
                  console.log('banner ad not loading')
                }
                adSize="smartBanner"
              />
            </View>
            <View
              style={{
                alignItems: 'flex-end',
                padding: 10,
                flexDirection: 'row',
              }}>
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[2] ? (
                  <ProfileBanner
                    imageStyle={{marginRight: 0, width: 50, height: 50}}
                    viewStyle={{flexDirection: 'column'}}
                    user={this.state.users[2]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[2])}
                  />
                ) : (
                  <Ionicons
                    color="white"
                    name="md-help-outline"
                    style={{alignSelf: 'center', marginBottom: 5}}
                    size={50}
                  />
                )}
                <View style={[styles.bar, {height: 100}]} />
              </View>
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[0] ? (
                  <ProfileBanner
                    imageStyle={{marginRight: 0, width: 50, height: 50}}
                    viewStyle={{flexDirection: 'column'}}
                    user={this.state.users[0]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[0])}
                  />
                ) : (
                  <Ionicons
                    color="white"
                    name="md-help-outline"
                    style={{alignSelf: 'center', marginBottom: 5}}
                    size={50}
                  />
                )}
                <View style={[styles.bar, {height: 200}]} />
              </View>
              <View style={styles.podium}>
                {this.state.showLeaderboard && this.state.users[1] ? (
                  <ProfileBanner
                    imageStyle={{marginRight: 0, width: 50, height: 50}}
                    viewStyle={{flexDirection: 'column'}}
                    user={this.state.users[1]}
                    size={40}
                    onPress={() => this.clickedUser(this.state.users[1])}
                  />
                ) : (
                  <Ionicons
                    color="white"
                    name="md-help-outline"
                    style={{alignSelf: 'center', marginBottom: 5}}
                    size={50}
                  />
                )}
                <View style={[styles.bar, {height: 150}]} />
              </View>
            </View>
            {this.state.users.map((user, index) => {
              return (
                <TouchableOpacity
                  onPress={() => this.clickedUser(user)}
                  key={index}
                  style={{
                    paddingHorizontal: 10,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    flexDirection: 'row',
                    width: '80%',
                    elevation: 1,
                    backgroundColor:
                      user.uid == this.state.current.uid
                        ? '#ffb52b'
                        : index % 2 == 0
                        ? '#2274A5'
                        : 'white',
                  }}>
                  <Text style={{color: 'black', fontSize: 15, margin: 5}}>
                    Rank {index + 1}{' '}
                  </Text>
                  <ProfileBanner
                    style={styles.profile}
                    user={user}
                    onPress={() => this.clickedUser(user)}
                  />
                  <Ionicons
                    name="md-star"
                    size={20}
                    style={{margin: 3}}
                    color={
                      user.uid == this.state.current.uid ? '#000' : '#ffb52b'
                    }
                  />
                  <Text style={{color: 'black', fontSize: 15}}>
                    {user.weeklyStars}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {this.state.users.some((e) => e.uid == this.state.current.uid) ||
            this.state.isAnonymous ? null : (
              <View
                style={{
                  margin: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  width: '80%',
                  elevation: 1,
                  backgroundColor: '#ffb52b',
                }}>
                <ProfileBanner
                  style={styles.profile}
                  user={this.state.current}
                />
                <Ionicons
                  name="md-star"
                  size={20}
                  style={{margin: 3}}
                  color="#000"
                />
                <Text style={{fontSize: 15}}>
                  {this.state.current.weeklyStars
                    ? this.state.current.weeklyStars
                    : 0}
                </Text>
              </View>
            )}
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
  bar: {
    backgroundColor: 'white',
    elevation: 3,
  },
  text: {
    fontSize: 13,
    margin: 5,
    color: 'white',
    alignSelf: 'center',
  },
  podium: {
    margin: 5,
    flex: 1,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(LeaderboardScreen);
